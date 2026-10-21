'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { imageUrl } from '@/lib/format';
import { cn } from '@/lib/utils';

type GalleryImage = { id: string; caption: string | null; fileName: string };

/** Thumbnail strip with a full-screen lightbox (keyboard: ← → Esc). */
export function ImageGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  if (images.length === 0) return null;
  const current = index !== null ? images[index] : null;
  const move = (d: number) => setIndex((i) => (i === null ? 0 : (i + d + images.length) % images.length));

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-video overflow-hidden rounded-lg border bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`Open image ${i + 1}${img.caption ? `: ${img.caption}` : ''}`}
          >
            <img src={imageUrl(img.id)} alt={img.caption ?? ''} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <Dialog open={index !== null} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent
          className="max-w-5xl gap-3 p-3 sm:max-w-5xl"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') move(1);
            if (e.key === 'ArrowLeft') move(-1);
          }}
        >
          <DialogTitle className="sr-only">{title} — images</DialogTitle>
          {current && (
            <div className="relative">
              <img src={imageUrl(current.id)} alt={current.caption ?? ''} className="max-h-[75vh] w-full rounded-md object-contain" />
              {images.length > 1 && (
                <>
                  <Button size="icon" variant="secondary" className="absolute top-1/2 left-2 -translate-y-1/2" onClick={() => move(-1)} aria-label="Previous image"><ChevronLeft /></Button>
                  <Button size="icon" variant="secondary" className="absolute top-1/2 right-2 -translate-y-1/2" onClick={() => move(1)} aria-label="Next image"><ChevronRight /></Button>
                </>
              )}
            </div>
          )}
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-muted-foreground">{current?.caption ?? current?.fileName}</span>
            <span className="flex gap-1">
              {images.map((img, i) => (
                <span key={img.id} className={cn('size-1.5 rounded-full bg-muted-foreground/30', i === index && 'bg-primary')} />
              ))}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
