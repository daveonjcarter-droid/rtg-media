import { PixelBunny, type BunnyMood } from "./PixelBunny";

export function BunnyLogo({ size = "md", mood = "idle", tag }: { size?: "sm" | "md" | "lg" | "xl"; mood?: BunnyMood; tag?: string }) {
  const px = { sm: 22, md: 30, lg: 64, xl: 120 }[size];
  return (
    <span className={`logo logo--${size}`}>
      <PixelBunny mood={mood} size={px} />
      <span className="logo__word">LUMA</span>
      {tag && <span className="logo__tag">{tag}</span>}
    </span>
  );
}
