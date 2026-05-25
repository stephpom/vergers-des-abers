import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SEO } from "@/components/SEO";

const Placeholder = ({ children }: { children: string }) => (
  <span className="bg-yellow-100 text-yellow-900 px-1 rounded font-mono text-sm">
    [À COMPLÉTER: {children}]
  </span>
);

const Confidentialite = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Politique de confidentialité"
      description="Politique de confidentialité et traitement des données personnelles sur le site Pom'Pom — Vergers des Abers."
    />
    <PublicHeader />

    <main className="container mx-auto px-4 py-12">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Dernière mise à jour : <Placeholder>date de mise en ligne</Placeholder>
        </p>

        <div className="space-y-10 text-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Préambule</h2>
            <p>
              La présente politique de confidentialité décrit la manière dont Pom'Pom — Vergers
              des Abers (ci-après « nous ») collecte, utilise et protège vos données personnelles
              dans le cadre de l'utilisation du site, conformément au Règlement Général sur la
              Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Responsable du traitement</h2>
            <p>
              <Placeholder>raison sociale / nom commercial</Placeholder>, dont les coordonnées
              complètes figurent dans les{" "}
              <Link to="/mentions-legales" className="text-primary hover:underline">
                mentions légales
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Données collectées</h2>
            <p>
              Nous collectons uniquement les données que vous nous fournissez volontairement via
              notre formulaire de contact :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Nom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Contenu du message</li>
            </ul>
            <p className="mt-3">
              Aucune autre donnée n'est collectée (pas d'inscription, pas de compte client, pas de
              suivi analytique à ce jour).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Finalité du traitement</h2>
            <p>
              Les données collectées via le formulaire de contact sont utilisées exclusivement
              pour répondre à votre demande. Elles ne font l'objet d'aucune prospection commerciale
              et ne sont jamais cédées à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Base légale</h2>
            <p>
              Le traitement de vos données repose sur votre consentement (article 6.1.a du RGPD),
              matérialisé par l'envoi volontaire du formulaire de contact.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Durée de conservation</h2>
            <p>
              Les messages reçus via le formulaire de contact sont conservés pendant{" "}
              <Placeholder>ex. 3 ans</Placeholder> à compter du dernier échange, à des fins de
              suivi de la relation. Passé ce délai, ils sont supprimés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Destinataires des données</h2>
            <p>
              Vos données sont accessibles uniquement par{" "}
              <Placeholder>responsable / personne en charge des réponses</Placeholder>. Elles sont
              transmises à notre prestataire d'envoi d'emails transactionnels{" "}
              <strong>Resend</strong> (
              <a
                href="https://resend.com/legal/privacy-policy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                politique de confidentialité Resend
              </a>
              ) le temps strictement nécessaire à l'acheminement du message.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (« droit à l'oubli »)</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit d'opposition</li>
              <li>Droit à la portabilité de vos données</li>
              <li>
                Droit d'introduire une réclamation auprès de la CNIL (
                <a
                  href="https://www.cnil.fr"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cnil.fr
                </a>
                )
              </li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à l'adresse{" "}
              <a
                href="mailto:pom-pom@mailo.com"
                className="text-primary hover:underline"
              >
                pom-pom@mailo.com
              </a>{" "}
              ou via notre{" "}
              <Link to="/contact" className="text-primary hover:underline">
                formulaire de contact
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Délégué à la protection des données</h2>
            <p>
              <Placeholder>
                indiquer si un DPO a été désigné — sinon mentionner « non désigné, contact direct
                via l'éditeur »
              </Placeholder>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Cookies</h2>
            <p>
              Le site n'utilise aucun cookie de traçage, de mesure d'audience ou de publicité à ce
              jour. Seuls les cookies strictement nécessaires au fonctionnement du site
              (authentification administrateur) sont déposés et ne nécessitent pas votre
              consentement.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <Placeholder>
                mettre à jour cette section si des analytics (Plausible, Matomo) sont ajoutées
              </Placeholder>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour
              protéger vos données contre tout accès non autorisé, perte ou destruction (HTTPS,
              hébergement OVH en France, sauvegardes régulières).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Modifications</h2>
            <p>
              Cette politique peut être amenée à évoluer. La date de dernière mise à jour figure
              en haut de cette page.
            </p>
          </section>
        </div>
      </article>
    </main>

    <PublicFooter />
  </div>
);

export default Confidentialite;
