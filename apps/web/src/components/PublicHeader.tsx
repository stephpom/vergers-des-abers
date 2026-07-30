import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import labelAB from "@/assets/label-ab-officiel.jpg";
import { api } from "@/lib/api";

export const PublicHeader = () => {
  const { data } = useQuery({
    queryKey: ["pressing-status"],
    queryFn: () => api<{ enabled: boolean }>("/api/pressing/status"),
  });

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:font-medium focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Aller au contenu principal
      </a>
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <img src={logo} alt="Pom'Pom Logo" className="h-12 w-auto" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold text-primary leading-tight">
                PomPom
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">Vergers des Abers</span>
            </div>
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <img src={labelAB} alt="Label Agriculture Biologique" className="h-10 w-auto" />
              <span className="text-xs text-muted-foreground">Certifié Bio</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/notre-histoire"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              Notre histoire
            </Link>
            {data?.enabled ? (
              <Link to="/reservation-pressage">
                <Button size="sm">
                  <CalendarDays className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Réserver un pressage</span>
                </Button>
              </Link>
            ) : null}
            <Link to="/contact">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
