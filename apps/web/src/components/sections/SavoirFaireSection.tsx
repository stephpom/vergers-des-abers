import { TreeDeciduous, Scissors, Leaf, Hand, Apple, Wine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: TreeDeciduous,
    title: "Choix des Variétés",
    description:
      "Dès la plantation, nous sélectionnons avec soin les variétés de pommes adaptées à notre terroir breton, privilégiant le goût et la qualité naturelle des fruits.",
  },
  {
    icon: Scissors,
    title: "Taille Douce",
    description:
      "Nous pratiquons une taille douce et respectueuse de l'arbre, favorisant son épanouissement naturel et une production de qualité sur le long terme.",
  },
  {
    icon: Leaf,
    title: "Fauchage Tardif",
    description:
      "Le fauchage tardif de nos vergers préserve la biodiversité et favorise un équilibre naturel. Insectes auxiliaires et flore sauvage contribuent à la santé de nos pommiers.",
  },
  {
    icon: Hand,
    title: "Ramassage à la Main",
    description:
      "Chaque pomme est cueillie et sélectionnée à la main, garantissant une récolte de fruits parfaitement mûrs et sans défauts pour un jus d'exception.",
  },
  {
    icon: Apple,
    title: "Pressage à Froid",
    description:
      "Nos pommes sont pressées à froid pour préserver toutes les vitamines, enzymes et saveurs naturelles. Aucune chaleur ne vient altérer la qualité du jus.",
  },
  {
    icon: Wine,
    title: "Mise en Bouteille",
    description:
      "Le jus est mis en bouteille sans additifs ni conservateurs, préservant ainsi toute l'authenticité et la fraîcheur de nos pommes bretonnes.",
  },
];

export const SavoirFaireSection = () => {
  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Notre Savoir-Faire</h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Du verger à la bouteille, un processus artisanal respectueux de la nature
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
