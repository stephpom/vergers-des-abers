import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/tests/utils';
import MentionsLegales from '@/pages/MentionsLegales';

describe('Page MentionsLegales', () => {
  it('affiche le titre principal', () => {
    renderWithProviders(<MentionsLegales />, { initialEntries: ['/mentions-legales'] });
    expect(
      screen.getByRole('heading', { name: /mentions légales/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('expose les rubriques obligatoires (éditeur, hébergeur, directeur de publication, contact)', () => {
    renderWithProviders(<MentionsLegales />, { initialEntries: ['/mentions-legales'] });
    expect(screen.getByRole('heading', { name: /éditeur/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /hébergeur/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /directeur de publication/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact/i })).toBeInTheDocument();
  });

  it("rend les placeholders [À COMPLÉTER] pour rappeler les infos à fournir", () => {
    renderWithProviders(<MentionsLegales />, { initialEntries: ['/mentions-legales'] });
    expect(screen.getAllByText(/à compléter/i).length).toBeGreaterThan(0);
  });
});
