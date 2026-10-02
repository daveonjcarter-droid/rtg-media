import type { FeedItem } from "../data/types";

export function ActivityFeed({ items, limit = 8, title = "OPERATOR FEED" }: { items: FeedItem[]; limit?: number; title?: string }) {
  return (
    <div className="feed">
      <div className="panel__head mono"><span>{title}</span><span className="blink">● LIVE</span></div>
      <ul>
        {items.slice(0, limit).map((f, i) => (
          <li key={f.id} className={`feed__item feed__item--${f.tone ?? "neutral"}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="feed__time mono">{f.time}</span>
            <span className="feed__text">{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
