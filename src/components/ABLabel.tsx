const ABLabel = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Fond vert */}
          <circle cx="50" cy="50" r="48" fill="hsl(144, 100%, 28%)" />
          {/* Bordure */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(76, 72%, 44%)" strokeWidth="2" />
          {/* Texte AB */}
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fill="white"
            fontSize="32"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            AB
          </text>
        </svg>
      </div>
      <span className="text-xs md:text-sm font-semibold text-primary mt-1">
        Agriculture Biologique
      </span>
      <span className="text-xs text-muted-foreground">
        Certifié depuis 3 ans
      </span>
    </div>
  );
};

export { ABLabel };
