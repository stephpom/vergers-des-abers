import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/utils';
import Contact from '@/pages/Contact';

const { mockApi } = vi.hoisted(() => ({ mockApi: vi.fn() }));
vi.mock('@/lib/api', () => ({
  api: mockApi,
  ApiError: class ApiError extends Error {
    status: number;
    details?: unknown;
    constructor(status: number, message: string, details?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details;
    }
  },
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Helper : filtre les appels à mockApi pour ne garder que ceux vers /api/contact
// (AuthProvider appelle /api/auth/me au montage, qu'on veut ignorer dans les assertions).
const contactCalls = () => mockApi.mock.calls.filter((c) => c[0] === '/api/contact');

describe('Page Contact', () => {
  beforeEach(() => {
    // Default : tout appel non explicitement reconfiguré rejette (équivalent /me non authed)
    mockApi.mockRejectedValue(new Error('Unauthenticated'));
  });

  afterEach(() => {
    mockToast.mockClear();
    mockApi.mockReset();
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

  it("soumission avec champs vides → erreurs zod, pas d'appel à /api/contact", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Contact />);
    await user.click(screen.getByRole('button', { name: /envoyer le message/i }));

    await waitFor(() => {
      expect(screen.getByText(/le nom doit contenir au moins 2 caractères/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
    expect(contactCalls()).toHaveLength(0);
  });

  it("soumission valide → POST /api/contact + toast succès + reset", async () => {
    mockApi.mockImplementation((path: string) => {
      if (path === '/api/contact') return Promise.resolve({ ok: true });
      return Promise.reject(new Error('Unauthenticated'));
    });
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

    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        body: {
          name: 'Jean Dupont',
          email: 'jean@example.com',
          phone: '0644086073',
          message: 'Bonjour, je voudrais en savoir plus sur vos produits.',
        },
      });
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Message envoyé !' }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nom/i)).toHaveValue('');
    });
  });

  it("soumission valide → si l'API échoue, toast destructive et le formulaire n'est pas vidé", async () => {
    mockApi.mockImplementation((path: string) => {
      if (path === '/api/contact') return Promise.reject(new Error('Network down'));
      return Promise.reject(new Error('Unauthenticated'));
    });
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

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      );
    });

    expect(screen.getByLabelText(/nom/i)).toHaveValue('Jean Dupont');
  });
});
