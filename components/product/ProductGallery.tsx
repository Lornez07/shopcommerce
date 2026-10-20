'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [null];
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-border">
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>

      {list.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {list.map((src, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={'View image ' + (index + 1)}
                aria-current={index === active}
                className={cn(
                  'relative block aspect-[4/5] w-full overflow-hidden rounded-sm border transition-colors',
                  index === active
                    ? 'border-text-primary'
                    : 'border-border hover:border-text-muted'
                )}
              >
                {src ? (
                  <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}