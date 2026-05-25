import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

export const PublicFooter = () => (
  <footer className="bg-muted/30 border-t py-12">
    <div className="container mx-auto px-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src={logo} alt="Pom'Pom Logo" className="h-10 w-auto" />
          <div className="flex flex-col items-start">
            <span className="text-lg font-bold text-primary">Pom'Pom</span>
            <span className="text-xs text-muted-foreground">Vergers des Abers</span>
          </div>
        </div>
        <p className="text-muted-foreground mb-4">Jus de pomme artisanal 100% naturel</p>
        <nav className="flex justify-center gap-6 text-sm text-muted-foreground mb-4">
          <Link to="/mentions-legales" className="hover:text-primary transition-colors">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="hover:text-primary transition-colors">
            Politique de confidentialité
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pom'Pom - Vergers des Abers. Tous droits réservés.
        </p>
      </div>
    </div>
  </footer>
);
