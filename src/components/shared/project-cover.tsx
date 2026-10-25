import { imageUrl } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Small deterministic hash so each project gets its own placeholder pattern. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/**
 * Project cover: the uploaded cover image, or a generated spectrum gradient
 * with frosted tiles (unique per project) when no image exists.
 */
export function ProjectCover({
  imageId,
  seed,
  title,
  className,
}: {
  imageId?: string | null;
  seed: string;
  title: string;
  className?: string;
}) {
  if (imageId) {
    return (
      <img src={imageUrl(imageId)} alt="" loading="lazy" className={cn('size-full object-cover', className)} />
    );
  }

  const h = hash(seed);
  // Two neighbouring stops from the tile spectrum (blue → violet → pink → orange).
  const start = h % 5;
  const from = `var(--tile-${start + 1})`;
  const to = `var(--tile-${start + 2})`;
  const rot = 110 + ((h >> 3) % 70);
  const letters = title
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

  return (
    <div
      className={cn('relative size-full overflow-hidden', className)}
      style={{
        background: `linear-gradient(${rot}deg, ${from} 0%, ${to} 100%)`,
      }}
      aria-hidden
    >
      {/* Frosted squares in the corner echo the hero tile field */}
      <div className="absolute -right-3 -bottom-3 grid w-1/2 grid-cols-4 gap-[3px] opacity-80">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="aspect-square rounded-[22%] bg-white shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]"
            style={{ opacity: ((h >> (i % 16)) & 3) * 0.07 + 0.08 + (i >= 8 ? 0.08 : 0) }}
          />
        ))}
      </div>
      <span className="absolute top-3 left-4 text-3xl font-semibold tracking-tight text-white/90 drop-shadow-sm">{letters}</span>
    </div>
  );
}
