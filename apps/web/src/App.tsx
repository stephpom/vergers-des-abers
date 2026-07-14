import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { PageLoader } from "@/components/PageLoader";

const Index = lazy(() => import("./pages/Index"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminProductForm = lazy(() => import("./pages/admin/ProductForm"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produits/:slug" element={<ProductDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<Confidentialite />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Navigate to="/admin/produits" replace />} />
              <Route
                path="/admin/produits"
                element={
                  <PrivateRoute>
                    <AdminProducts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/produits/nouveau"
                element={
                  <PrivateRoute>
                    <AdminProductForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/produits/:id"
                element={
                  <PrivateRoute>
                    <AdminProductForm />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
