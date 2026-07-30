import labelAB from "@/assets/label-ab-officiel.jpg";
import { Download } from "lucide-react";

const certificateUrl = "/documents/certificat-agriculture-biologique-europe.pdf";

const ABLabel = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img src={labelAB} alt="Label Agriculture Biologique" className="w-20 h-auto md:w-24" />
      <span className="text-xs text-muted-foreground mt-1">Certifié depuis 2023</span>
      <a
        href={certificateUrl}
        download="certificat-agriculture-biologique-europe.pdf"
        className="mt-3 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Télécharger notre certificat bio
      </a>
    </div>
  );
};

export { ABLabel };
