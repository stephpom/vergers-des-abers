import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.svg';
import labelAB from '@/assets/label-ab-officiel.jpg';

export const PublicHeader = () => (
  <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <img src={logo} alt="Pom'Pom Logo" className="h-12 w-auto" />
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-bold text-primary leading-tight">PomPom</span>
          <span className="text-xs md:text-sm text-muted-foreground">Vergers des Abers</span>
        </div>
        <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-border">
          <img src={labelAB} alt="Label Agriculture Biologique" className="h-10 w-auto" />
          <span className="text-xs text-muted-foreground">Certifié Bio</span>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/contact">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </Link>
      </div>
    </div>
  </header>
);
