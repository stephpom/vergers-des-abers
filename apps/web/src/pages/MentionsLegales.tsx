import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SEO } from "@/components/SEO";

const Placeholder = ({ children }: { children: string }) => (
  <span className="bg-yellow-100 text-yellow-900 px-1 rounded font-mono text-sm">
    [À COMPLÉTER: {children}]
  </span>
);

const MentionsLegales = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Mentions légales"
      description="Mentions légales du site Pom'Pom — Vergers des Abers à Plouguerneau."
    />
    <PublicHeader />

    <main id="main-content" className="container mx-auto px-4 py-12">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Mentions légales</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Dernière mise à jour : <Placeholder>01/07/2026</Placeholder>
        </p>

        <div className="space-y-10 text-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Éditeur du site</h2>
            <p>
              <strong>Raison sociale :</strong>{" "}
              <Placeholder>Stéphane Pommier - Terre de jeux</Placeholder>
              <br />
              <strong>Forme juridique :</strong>{" "}
              <Placeholder>Entreprise Individuelle</Placeholder>
              <br />
              <strong>SIRET :</strong> <Placeholder>90501504600014</Placeholder>
              <br />
              <strong>Adresse :</strong> 592 Lanvaon, 29880 Plouguerneau, France
              <br />
              <strong>Téléphone :</strong>{" "}
              <a href="tel:0644086073" className="text-primary hover:underline">
                06 44 08 60 73
              </a>
              <br />
              <strong>Email :</strong>{" "}
              <a href="mailto:pom-pom@mailo.com" className="text-primary hover:underline">
                pom-pom@mailo.com
              </a>
              <br />
              <strong>TVA intracommunautaire :</strong>{" "}
              <Placeholder>FR18 905015046</Placeholder>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Directeur de publication</h2>
            <p>
              <Placeholder>Stéphane Pommier</Placeholder>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Hébergeur</h2>
            <p>
              <strong>OVH SAS</strong>
              <br />
              2 rue Kellermann, 59100 Roubaix, France
              <br />
              Téléphone :{" "}
              <a href="tel:+33972101007" className="text-primary hover:underline">
                +33 9 72 10 10 07
              </a>
              <br />
              Site web :{" "}
              <a
                href="https://www.ovhcloud.com"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                ovhcloud.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, photographies, logos, structure
              générale) est la propriété exclusive de Pom'Pom — Vergers des Abers, sauf mentions
              contraires. Toute reproduction, représentation, modification, publication, adaptation
              de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé,
              est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Crédits</h2>
            <p>
              Photographies : <Placeholder>crédit photos Stéphane Pommier, CC BY 4.0</Placeholder>
              <br />
              Conception et développement : <Placeholder>Stéphane Pommier, François Bouyer</Placeholder>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Données personnelles</h2>
            <p>
              Pour toute information relative au traitement de vos données personnelles, consultez
              notre{" "}
              <Link to="/confidentialite" className="text-primary hover:underline">
                politique de confidentialité
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p>
              Pour toute question concernant ces mentions légales ou le contenu du site, vous pouvez
              nous écrire via notre{" "}
              <Link to="/contact" className="text-primary hover:underline">
                formulaire de contact
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>

    <PublicFooter />
  </div>
);

export default MentionsLegales;
