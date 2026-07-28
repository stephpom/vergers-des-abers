import { NavLink } from "react-router-dom";

const sections = [
  {
    to: "/admin/produits",
    label: "Produits",
    description: "Gérer les produits et leurs visuels",
  },
  {
    to: "/admin/points-de-vente",
    label: "Points de vente",
    description: "Gérer les points de vente et leurs informations",
  },
];

interface AdminSectionSwitcherProps {
  className?: string;
}

const AdminSectionSwitcher = ({ className = "" }: AdminSectionSwitcherProps) => {
  return (
    <nav
      className={`grid gap-3 md:grid-cols-2 ${className}`.trim()}
      aria-label="Sections d'administration"
    >
      {sections.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          className={({ isActive }) =>
            [
              "rounded-lg border p-4 text-left transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/20",
            ].join(" ")
          }
        >
          <div className="font-semibold">{section.label}</div>
          <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminSectionSwitcher;
