import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { mockUser } from './mocks/handlers';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/** Composant de test avec bouton logout */
function AuthWithLogout() {
  const { user, loading, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'done'}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('loading: true au mount, puis false après /api/auth/me', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('si /api/auth/me retourne 401 → user: null', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('si /api/auth/me retourne un user → user est défini', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(mockUser);
  });

  it('login() avec credentials valides → user est mis à jour', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
      http.post('/api/auth/login', () => HttpResponse.json({ user: mockUser })),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('admin@test.com', 'password');
    });
    expect(result.current.user).toEqual(mockUser);
  });

  it('logout() → user devient null', async () => {
    // Note: ce test utilise render() car renderHook + waitFor a un bug de timing
    // avec le test précédent (login 401) qui laisse React dans un état d'erreur interne.
    const user = userEvent.setup();
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })),
      http.post('/api/auth/logout', () => HttpResponse.json({})),
    );
    render(<AuthWithLogout />, {
      wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>,
    });
    await waitFor(
      () => expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email),
      { timeout: 3000 },
    );
    await user.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  it('login() 401 → throw ApiError, user reste null', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
      http.post('/api/auth/login', () =>
        HttpResponse.json({ error: 'Identifiants invalides' }, { status: 401 }),
      ),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(
      act(async () => result.current.login('wrong@test.com', 'bad')),
    ).rejects.toMatchObject({ status: 401 });
    expect(result.current.user).toBeNull();
  });
});
