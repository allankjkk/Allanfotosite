"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Photograph } from "./photograph";

type Slide = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};
function subscribe(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
export function HomeCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function revealControls() {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }
  useEffect(() => {
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);
  const reduceMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const running = !paused && !reduceMotion && slides.length > 1;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [running, slides.length, active]);
  const index = active % slides.length;
  return (
    <div
      className="home-carousel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Fotografias em destaque"
      onPointerMove={revealControls}
      onPointerDown={revealControls}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) {
          setPaused(true);
          revealControls();
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="carousel-stage" aria-live="off">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`carousel-slide ${i === index ? "is-active" : ""}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            <div className="carousel-image">
              <Photograph
                src={slide.src}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                priority={i === 0}
                cover
              />
            </div>
          </div>
        ))}
      </div>
      <div className={`carousel-controls ${controlsVisible ? "" : "is-hidden"}`}>
        <div
          className="carousel-dots"
          role="group"
          aria-label="Escolher fotografia"
        >
          {slides.map((slide, i) => (
            <button
              type="button"
              key={slide.id}
              aria-label={`Mostrar fotografia ${i + 1}: ${slide.alt}`}
              aria-pressed={i === index}
              onClick={() => {
                setActive(i);
                revealControls();
              }}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
