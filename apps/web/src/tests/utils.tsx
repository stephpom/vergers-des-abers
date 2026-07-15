import { ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import type { ApiUser } from "@/types/api";
import { mockUser } from "./mocks/handlers";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderOptions {
  /** Routes initiales pour MemoryRouter, ex: ['/admin/produits'] */
  initialEntries?: string[];
  /** Route pattern pour le composant principal, ex: '/admin/produits/:id' */
  routePath?: string;
}

/**
 * Wraps ui with QueryClientProvider + MemoryRouter + AuthProvider + TooltipProvider.
 * Si routePath est fourni, le composant est rendu dans une Route avec ce pattern.
 */
export function renderWithProviders(
  ui: ReactNode,
  { initialEntries = ["/"], routePath }: RenderOptions = {},
) {
  const queryClient = createTestQueryClient();

  function Wrapper() {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <AuthProvider>
              {routePath ? (
                <Routes>
                  <Route path={routePath} element={ui} />
                </Routes>
              ) : (
                ui
              )}
            </AuthProvider>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return render(<Wrapper />);
}

/**
 * Configure MSW pour que /api/auth/me retourne un user authentifié.
 * À appeler AVANT renderWithProviders dans les tests qui nécessitent un user connecté.
 */
export function mockAuthenticated(user: ApiUser = mockUser) {
  server.use(
    http.get("/api/auth/me", () => {
      return HttpResponse.json({ user });
    }),
  );
}
