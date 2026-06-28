import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SEO } from "@/components/SEO";

const NotFound = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SEO title="Page introuvable" noindex />
    <PublicHeader />

    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <FileQuestion className="w-20 h-20 text-muted-foreground mx-auto mb-6" aria-hidden="true" />
        <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oups ! Cette page n'existe pas (ou plus).
        </p>
        <Button asChild size="lg">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </main>

    <PublicFooter />
  </div>
);

export default NotFound;
