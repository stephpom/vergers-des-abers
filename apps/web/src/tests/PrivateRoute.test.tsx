import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { renderWithProviders, mockAuthenticated } from './utils';
import { PrivateRoute } from '@/components/PrivateRoute';
import { Routes, Route } from 'react-router-dom';
import { ReactNode } from 'react';

function renderPrivateRoute(children: ReactNode, initialPath = '/protected') {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/login" element={<div>Page login</div>} />
      <Route
        path="/protected"
        element={<PrivateRoute>{children}</PrivateRoute>}
      />
    </Routes>,
    { initialEntries: [initialPath] },
  );
}

describe('PrivateRoute', () => {
  it('affiche un loader pendant le chargement', () => {
    // /api/auth/me ne répond pas encore → loading: true
    server.use(
      http.get('/api/auth/me', async () => {
        // Simule un délai pour rester en état loading
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return HttpResponse.json({ user: null });
      }),
    );
    renderPrivateRoute(<div>Contenu protégé</div>);
    // Le loader Loader2 est rendu
    const loaders = document.querySelectorAll('svg');
    expect(loaders.length).toBeGreaterThan(0);
  });

  it('redirige vers /admin/login si user: null', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ user: null }, { status: 401 })),
    );
    renderPrivateRoute(<div>Contenu protégé</div>);
    await waitFor(() => {
      expect(screen.getByText('Page login')).toBeInTheDocument();
    });
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('affiche les children si user défini', async () => {
    mockAuthenticated();
    renderPrivateRoute(<div>Contenu protégé</div>);
    await waitFor(() => {
      expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
    });
  });
});
