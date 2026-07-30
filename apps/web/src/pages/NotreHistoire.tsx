import { Link } from "react-router-dom";
import { ArrowRight, Flower2, Leaf, Sprout } from "lucide-react";
import { ABLabel } from "@/components/ABLabel";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { SEO } from "@/components/SEO";
import biodiversityImage from "@/assets/biodiversite-pollinisateur.webp";
import orchardCareImage from "@/assets/stephane-entretien-verger.webp";
import producerImage from "@/assets/stephane-pommier-vergers.webp";
import appleJuiceImage from "@/assets/jus-pomme-verger.webp";

const commitments = [
  {
    icon: Flower2,
    title: "Laisser fleurir",
    description:
      "Le fauchage tardif permet aux herbes et aux fleurs sauvages d'accomplir leur cycle et d'offrir le gîte et le couvert à de nombreux insectes.",
  },
  {
    icon: Leaf,
    title: "Cultiver en bio",
    description:
      "Certifiés en agriculture biologique depuis 2023, les vergers sont conduits dans le respect des équilibres naturels et de la vie des sols.",
  },
  {
    icon: Sprout,
    title: "Observer avant d'agir",
    description:
      "Chaque intervention est pensée au rythme des arbres, des saisons et de la faune auxiliaire présente dans les vergers.",
  },
];

const NotreHistoire = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Notre histoire"
      description="Découvrez l'histoire de Stéphane Pommier et des Vergers des Abers, un projet biologique attentif à la biodiversité et au terroir breton."
    />
    <PublicHeader />

    <main id="main-content">
      <section className="relative flex min-h-[520px] items-end overflow-hidden">
        <img
          src={orchardCareImage}
          alt="Stéphane Pommier observant les pommiers des Vergers des Abers"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="container relative mx-auto px-4 pb-14 pt-32 text-white md:pb-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            Notre histoire
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Des vergers vivants au cœur des Abers
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
            Une aventure née de l'envie de produire autrement, en prenant soin des pommiers, du
            paysage et de toute la vie qui les entoure.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-14">
            <img
              src={producerImage}
              alt="Portrait de Stéphane Pommier dans son verger"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
              loading="lazy"
            />
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                Derrière Pom'Pom
              </p>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">Je suis Stéphane Pommier</h2>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  Pom'Pom s'est construit autour d'une idée simple : faire vivre des vergers à
                  taille humaine et transformer leurs fruits au plus près du lieu où ils poussent.
                </p>
                <p>
                  Sur les terres de l'Aber Wrac'h, de l'Aber Benoît et de l'Aber Ildut, je cultive
                  les pommiers et accompagne les fruits jusqu'à la bouteille. Cette proximité me
                  permet de rester attentif à chaque arbre et à chaque saison.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                  Un écosystème à préserver
                </p>
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                  La biodiversité fait partie du verger
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Un verger ne se résume pas à ses pommiers. Fleurs sauvages, pollinisateurs,
                  oiseaux, auxiliaires et vie du sol participent à son équilibre. Leur laisser une
                  place, c'est rendre le verger plus vivant et plus résilient.
                </p>
              </div>
              <img
                src={biodiversityImage}
                alt="Pollinisateur butinant une fleur sauvage dans les Vergers des Abers"
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
                loading="lazy"
              />
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {commitments.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border bg-background p-6">
                  <Icon className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
                  <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-14">
            <img
              src={appleJuiceImage}
              alt="Bouteille de jus Pom'Pom présentée dans un pommier en fleurs"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
              loading="lazy"
            />
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                Du fruit à la bouteille
              </p>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">Transformer sans dénaturer</h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                Les pommes sont sélectionnées puis pressées à froid afin de préserver leurs saveurs.
                Le résultat raconte le verger, ses variétés et le caractère des fruits récoltés.
              </p>
              <ABLabel className="items-start" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-14 text-primary-foreground">
        <div className="container mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="text-3xl font-bold">Envie d'en savoir plus ?</h2>
          <p className="max-w-2xl text-lg text-primary-foreground/85">
            Retrouvez nos boissons ou contactez-moi pour échanger autour des vergers et de leur
            histoire.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/#products"
              className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Découvrir les produits <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/contact"
              className="rounded-lg border border-primary-foreground/50 px-6 py-3 font-semibold transition-colors hover:bg-primary-foreground/10"
            >
              Me contacter
            </Link>
          </div>
        </div>
      </section>
    </main>

    <PublicFooter />
  </div>
);

export default NotreHistoire;
