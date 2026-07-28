import { ABLabel } from "@/components/ABLabel";

export const AboutSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Nos Vergers des Abers</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Pom'Pom, c'est avant tout une histoire de passion pour la pomme et le terroir
                breton. Nos vergers, situés sur l'Aber Wrac'h, l'Aber Benoit et l'Aber Ildut,
                produisent{" "}
                <strong className="text-foreground">des pommes de qualité, pressées à froid</strong>{" "}
                pour préserver toutes les saveurs et vitamines naturelles. Chaque bouteille reflète
                l'authenticité de notre région et le savoir-faire artisanal.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nous produisons également du{" "}
                <strong className="text-foreground">Kefir artisanal</strong>, une boisson fermentée
                rafraîchissante aux multiples bienfaits, déclinée en plusieurs saveurs : citron,
                pamplemousse, gingembre, menthe et hibiscus.
              </p>
            </div>
            <div className="flex-shrink-0">
              <ABLabel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
