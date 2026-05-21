import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/tests/utils';
import NotFound from '@/pages/NotFound';

describe('Page NotFound', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche "404"', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(<NotFound />, { initialEntries: ['/page-inconnue'] });
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('affiche un lien de retour vers "/"', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(<NotFound />, { initialEntries: ['/page-inconnue'] });
    const link = screen.getByRole('link', { name: /retour à l'accueil/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('appelle console.error au montage (comportement actuel)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(<NotFound />, { initialEntries: ['/page-inconnue'] });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('404 Error'),
      expect.anything(),
    );
  });
});
