import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { absoluteUrl } from "@/lib/seo";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "product" | "article";
  noindex?: boolean;
  children?: React.ReactNode;
}

const SITE_NAME = "Pom'Pom — Vergers des Abers";
const DEFAULT_DESCRIPTION =
  "Jus de pomme artisanal 100% naturel des Vergers des Abers à Plouguerneau. Pressé à froid, sans additifs ni conservateurs.";

export function SEO({
  title,
  description,
  image,
  type = "website",
  noindex = false,
  children,
}: SEOProps) {
  const location = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = absoluteUrl(location.pathname);
  const imageUrl = image ? absoluteUrl(image) : absoluteUrl("/og-image.jpg");

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={imageUrl} />

      {children}
    </Helmet>
  );
}
