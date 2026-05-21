import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/utils';
import Contact from '@/pages/Contact';

// Mock useToast pour capturer les appels toast()
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('Page Contact', () => {
  afterEach(() => {
    mockToast.mockClear();
    vi.restoreAllMocks();
  });

  it('affiche les champs nom, email, téléphone, message, bouton submit et iframe Google Maps', () => {
    renderWithProviders(<Contact />);
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer le message/i })).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeInTheDocument();
  });

  it("soumission avec champs vides → erreurs zod, pas d'appel à console.log", async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const user = userEvent.setup();

    renderWithProviders(<Contact />);
    await user.click(screen.getByRole('button', { name: /envoyer le message/i }));

    await waitFor(() => {
      expect(screen.getByText(/le nom doit contenir au moins 2 caractères/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('soumission valide → console.log appelé avec les données + toast succès', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // delay: null = pas de délai entre les frappes, pour ne pas cumuler avec le setTimeout du form
    const user = userEvent.setup({ delay: null });

    renderWithProviders(<Contact />);

    await user.type(screen.getByLabelText(/nom/i), 'Jean Dupont');
    await user.type(screen.getByLabelText(/email/i), 'jean@example.com');
    await user.type(screen.getByLabelText(/téléphone/i), '0644086073');
    await user.type(
      screen.getByLabelText(/message/i),
      'Bonjour, je voudrais en savoir plus sur vos produits.',
    );

    await user.click(screen.getByRole('button', { name: /envoyer le message/i }));

    // Le onSubmit simule un délai de 1 seconde (setTimeout 1000ms) puis console.log + toast
    await waitFor(
      () => {
        expect(consoleSpy).toHaveBeenCalledWith('Form data:', {
          name: 'Jean Dupont',
          email: 'jean@example.com',
          phone: '0644086073',
          message: 'Bonjour, je voudrais en savoir plus sur vos produits.',
        });
      },
      { timeout: 3000 },
    );

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Message envoyé !' }),
    );
  }, 10000);
});
