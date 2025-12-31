import labelAB from "@/assets/label-ab-officiel.jpg";

const ABLabel = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img 
        src={labelAB} 
        alt="Label Agriculture Biologique" 
        className="w-20 h-auto md:w-24"
      />
      <span className="text-xs text-muted-foreground mt-1">
        Certifié depuis 3 ans
      </span>
    </div>
  );
};

export { ABLabel };
