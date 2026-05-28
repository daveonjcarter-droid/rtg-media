import { Helmet } from "react-helmet-async";

const SITE_URL = "https://runnerstogreatness.com";

type PageSeoProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
};

/**
 * Per-route head tags. Renders unique title, meta description,
 * self-referencing canonical, and Open Graph tags for any static page.
 */
const PageSeo = ({ title, description, path, image, type = "website" }: PageSeoProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};

export default PageSeo;
