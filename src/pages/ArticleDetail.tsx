import { useParams, Link } from "react-router-dom";
import { Newspaper, ArrowLeft } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";

const ArticleDetail = () => {
  const { id } = useParams();

  // Articles aren't published yet — no fake fallback content.
  return (
    <SiteLayout>
      <section className="container-rtg py-20 md:py-28">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-10"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Articles
        </Link>
        <EmptyState
          eyebrow="The Magazine"
          title="This story isn't live yet."
          description={
            id
              ? "RTG Media is preparing its first releases. The article you're looking for hasn't been published."
              : "RTG Media is preparing its first releases."
          }
          icon={Newspaper}
        />
      </section>
    </SiteLayout>
  );
};

export default ArticleDetail;
