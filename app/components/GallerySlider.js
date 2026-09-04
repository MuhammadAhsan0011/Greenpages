"use client";

// This MUST be a Client Component — moving between photos needs click
// (and keyboard) event handlers and local "which photo is showing" state,
// neither of which a Server Component can provide.

import { useState } from "react";
import Image from "next/image";

export default function GallerySlider({ images, alt }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const hasMultiple = images.length > 1;

  function goTo(nextIndex) {
    setIndex((nextIndex + images.length) % images.length);
  }

  return (
    <div
      className="listing-gallery-main"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goTo(index - 1);
        if (event.key === "ArrowRight") goTo(index + 1);
      }}
      tabIndex={hasMultiple ? 0 : -1}
    >
      <Image
        key={images[index]}
        src={images[index]}
        alt={alt}
        fill
        sizes="(max-width: 900px) 100vw, 480px"
        style={{ objectFit: "cover" }}
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            className="listing-gallery-arrow listing-gallery-arrow-prev"
            onClick={() => goTo(index - 1)}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="listing-gallery-arrow listing-gallery-arrow-next"
            onClick={() => goTo(index + 1)}
            aria-label="Next photo"
          >
            ›
          </button>
          <span className="listing-gallery-count">
            {index + 1} / {images.length}
          </span>
          <div className="listing-gallery-dots">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={`listing-gallery-dot${i === index ? " is-active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
