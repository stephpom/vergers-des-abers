import { SEO } from "@/components/SEO";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSectionSwitcher from "@/components/admin/AdminSectionSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminHome = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Administration" noindex />
      <AdminHeader
        title="Administration"
        rightAction={
          <>
            <p className="text-xs text-muted-foreground text-right">{user?.email}</p>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </>
        }
      />

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Choisir une section</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sélectionnez la gestion à administrer depuis ce menu.
          </p>
          <div className="mt-8">
            <AdminSectionSwitcher />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminHome;
