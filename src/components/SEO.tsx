import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function SEO({
  title = "Limitless Studio",
  description = "Limitless Studio — Diseño y desarrollo sin fronteras.",
  image = "/images/LIMITLESS.png",
  url = "https://limitless.studio", // TODO: Update with real domain later
}: SEOProps) {
  const fullTitle = title === "Limitless Studio" ? title : `${title} | Limitless`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph tags for Facebook, LinkedIn, WhatsApp */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
