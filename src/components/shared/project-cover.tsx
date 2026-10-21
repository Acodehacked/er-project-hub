import { imageUrl } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Small deterministic hash so each project gets its own placeholder pattern. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/**
 * Project cover: the uploaded cover image, or a generated "blueprint" pattern
 * (unique per project) when no image exists.
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
  const hue = [38, 28, 200, 230, 160][h % 5]!;
  const rot = (h >> 3) % 360;
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
        background: `linear-gradient(${rot}deg, oklch(0.62 0.17 ${hue}) 0%, oklch(0.45 0.09 ${(hue + 40) % 360}) 100%)`,
      }}
      aria-hidden
    >
      <svg className="absolute inset-0 size-full text-white/15" preserveAspectRatio="none">
        <defs>
          <pattern id={`g${h}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#g${h})`} />
      </svg>
      <svg className="absolute right-3 bottom-3 size-20 text-white/25" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="50" cy="50" r={18 + (h % 12)} />
        <path d={`M10 ${30 + (h % 40)} H40 L50 50 H90`} />
        <circle cx="90" cy="50" r="4" fill="currentColor" />
      </svg>
      <span className="absolute top-3 left-4 font-mono text-3xl font-bold tracking-tight text-white/85 drop-shadow-sm">{letters}</span>
    </div>
  );
}
