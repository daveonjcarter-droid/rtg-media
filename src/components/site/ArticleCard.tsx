import { Link } from "react-router-dom";
import { Story } from "@/data/stories";

const ArticleCard = ({ story, size = "md" }: { story: Story; size?: "sm" | "md" | "lg" }) => {
  const aspect = size === "lg" ? "aspect-[16/10]" : "aspect-[4/3]";
  return (
    <Link to={`/articles/${story.id}`} className="group block hover-lift">
      <div className={`relative overflow-hidden ${aspect} bg-surface`}>
        <img
          src={story.image}
          alt={story.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-sm">
          {story.category}
        </span>
      </div>
      <div className="pt-4">
        <h3 className={`${size === "lg" ? "text-2xl md:text-3xl" : "text-lg"} font-display uppercase leading-tight group-hover:text-primary transition-colors`}>
          {story.title}
        </h3>
        <div className="mt-2 text-xs text-muted-foreground tracking-wider">
          By {story.author} · {story.date}
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
