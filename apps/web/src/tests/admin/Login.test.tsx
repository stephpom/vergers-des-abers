import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../utils';
import AdminLogin from '@/pages/admin/Login';
import { Routes, Route } from 'react-router-dom';

// Mock sonner au niveau module (ESM — vi.spyOn n'est pas possible)
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
  Toaster: () => null,
}));

// Import après le mock pour récupérer les mocked fns
import { toast } from 'sonner';

function renderLogin(initialEntries: Array<string | { pathname: string; state: unknown }> = ['/admin/login']) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/produits" element={<div>Page produits</div>} />
      <Route path="/admin/produits/xyz" element={<div>Page produit xyz</div>} />
    </Routes>,
    { initialEntries: initialEntries as string[] },
  );
}

describe('Admin Login', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it('rend le form avec champs email, password et bouton Se connecter', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
    );
    renderLogin();
    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it("soumission avec champs vides → erreurs zod, pas d'appel réseau", async () => {
    const user = userEvent.setup();
    let loginCalled = false;
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
      http.post('/api/auth/login', () => {
        loginCalled = true;
        return HttpResponse.json({ user: null });
      }),
    );
    renderLogin();
    await waitFor(() => expect(screen.getByLabelText('Email')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText('Email invalide')).toBeInTheDocument();
    });
    expect(screen.getByText('Mot de passe requis')).toBeInTheDocument();
    expect(loginCalled).toBe(false);
  });

  it('soumission avec credentials valides → POST /api/auth/login + redirect produits', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json() as { email: string; password: string };
        if (body.email === 'admin@test.com' && body.password === 'password') {
          return HttpResponse.json({ user: { id: 'user-1', email: 'admin@test.com' } });
        }
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }),
    );
    renderLogin();
    await waitFor(() => expect(screen.getByLabelText('Email')).toBeInTheDocument());
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText('Page produits')).toBeInTheDocument();
    });
  });

  it('si state.from = /admin/produits/xyz → redirect vers /admin/produits/xyz', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
      http.post('/api/auth/login', () =>
        HttpResponse.json({ user: { id: 'user-1', email: 'admin@test.com' } }),
      ),
    );
    renderWithProviders(
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/produits/xyz" element={<div>Page produit xyz</div>} />
        <Route path="/admin/produits" element={<div>Page produits</div>} />
      </Routes>,
      {
        initialEntries: [
          { pathname: '/admin/login', state: { from: { pathname: '/admin/produits/xyz' } } },
        ] as unknown as string[],
      },
    );
    await waitFor(() => expect(screen.getByLabelText('Email')).toBeInTheDocument());
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText('Page produit xyz')).toBeInTheDocument();
    });
  });

  it("réponse 401 → toast.error 'Identifiants invalides'", async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
      http.post('/api/auth/login', () =>
        HttpResponse.json({ error: 'Identifiants invalides' }, { status: 401 }),
      ),
    );
    renderLogin();
    await waitFor(() => expect(screen.getByLabelText('Email')).toBeInTheDocument());
    await user.type(screen.getByLabelText('Email'), 'wrong@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'badpassword');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Identifiants invalides');
    });
  });
});
