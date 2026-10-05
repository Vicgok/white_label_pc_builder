import { useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BrandLink } from "./BrandLink";
import { money } from "../domain/pricing";
import "./HeroPcScene.css";

// The illustrated SVGs are separate transparent placeholders. Each path can be
// replaced with a registered, aligned transparent WebP/PNG without changing motion.
const layers = [
  { id: "case", src: "/images/hero/case.svg", alt: "PC chassis" },
  {
    id: "motherboard",
    src: "/images/hero/motherboard.svg",
    alt: "Motherboard",
  },
  { id: "storage", src: "/images/hero/storage.svg", alt: "NVMe storage" },
  { id: "psu", src: "/images/hero/psu.svg", alt: "Power supply" },
  { id: "ram", src: "/images/hero/ram.svg", alt: "Memory modules" },
  { id: "cooler", src: "/images/hero/cooler.svg", alt: "CPU liquid cooler" },
  { id: "gpu", src: "/images/hero/gpu.svg", alt: "Graphics card" },
  {
    id: "panel",
    src: "/images/hero/side-panel.svg",
    alt: "Tempered glass side panel",
  },
] as const;

export const heroBuild = {
  cpu: "Ryzen 7 9700X",
  gpu: "RTX 5070",
  memory: "32GB DDR5",
  storage: "1TB NVMe",
  cooling: "240mm AIO",
  platform: "AM5 / DDR5",
  price: 142990,
  suitability: ["1440p Gaming", "Editing", "Streaming"],
} as const;

const story = [
  "Built around your needs.",
  "Every component matters.",
  "Compatibility checked.",
  "Balanced before it's built.",
];

type LayerId = (typeof layers)[number]["id"];
type Motion = {
  start: number;
  end: number;
  x: number;
  y: number;
  rotate?: number;
  scale?: number;
};
const desktopMotion: Record<LayerId, Motion> = {
  case: { start: 0, end: 1, x: 0, y: 0 },
  panel: { start: 0.1, end: 0.45, x: 160, y: -8, scale: 1.02 },
  gpu: { start: 0.25, end: 0.65, x: 155, y: 24, rotate: -3 },
  cooler: { start: 0.35, end: 0.7, x: -125, y: -68, rotate: -2 },
  motherboard: { start: 0.4, end: 0.75, x: -65, y: 12, scale: 0.99 },
  ram: { start: 0.45, end: 0.72, x: 88, y: -92 },
  storage: { start: 0.55, end: 0.82, x: 90, y: 120, scale: 0.99 },
  psu: { start: 0.55, end: 0.85, x: -102, y: 92, scale: 0.98 },
};

const mobileMotion: Record<LayerId, Motion> = {
  ...desktopMotion,
  panel: { start: 0.12, end: 0.49, x: 58, y: -5 },
  gpu: { start: 0.29, end: 0.75, x: 60, y: 24 },
  cooler: { start: 0.4, end: 0.78, x: -67, y: -47 },
  motherboard: { start: 0, end: 1, x: 0, y: 0 },
  ram: { start: 0, end: 1, x: 0, y: 0 },
  storage: { start: 0, end: 1, x: 0, y: 0 },
  psu: { start: 0, end: 1, x: 0, y: 0 },
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const range = (value: number, start: number, end: number) =>
  clamp((value - start) / (end - start));

export function HeroPcScene({
  trustPoints,
  title,
}: {
  trustPoints: string[];
  title: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const scene = section.querySelector<HTMLElement>(".hero-pc-scene");
    if (!scene) return;
    const images = new Map<LayerId, HTMLElement>();
    layers.forEach((layer) => {
      const element = scene.querySelector<HTMLElement>(
        `[data-layer="${layer.id}"]`,
      );
      if (element) images.set(layer.id, element);
    });
    const callouts = Array.from(
      section.querySelectorAll<HTMLElement>("[data-callout]"),
    );
    const messages = Array.from(
      section.querySelectorAll<HTMLElement>("[data-story]"),
    );
    const final = section.querySelector<HTMLElement>(".hero-pc-final");
    const entry = section.querySelector<HTMLElement>(".hero-pc-entry");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 767px)");
    let frame = 0;

    const draw = () => {
      frame = 0;
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = reduced.matches
        ? 1
        : clamp(-section.getBoundingClientRect().top / travel);
      const motion = mobile.matches ? mobileMotion : desktopMotion;
      const scale = scene.clientWidth / 700;
      section.dataset.progress = progress.toFixed(3);

      images.forEach((element, id) => {
        if (
          id === "case" ||
          (mobile.matches && (id === "ram" || id === "storage" || id === "psu"))
        )
          return;
        const item = motion[id];
        const t = range(progress, item.start, item.end);
        const x = item.x * scale * t;
        const y = item.y * scale * t;
        const rotation = (item.rotate || 0) * t;
        const depth = 1 + ((item.scale || 1) - 1) * t;
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${depth})`;
        element.style.opacity = `${reduced.matches ? 1 : 1 - range(progress, 0.94, 1) * 0.28}`;
      });

      const calloutStarts: Record<string, number> = {
        gpu: 0.37,
        cooling: 0.47,
        platform: 0.54,
        memory: 0.58,
      };
      callouts.forEach((element) => {
        const key = element.dataset.callout || "";
        const opacity = reduced.matches
          ? 1
          : range(
              progress,
              calloutStarts[key],
              (calloutStarts[key] || 0) + 0.1,
            ) *
            (1 - range(progress, 0.94, 1) * 0.22);
        element.style.opacity = `${opacity}`;
        element.style.transform = `translate3d(0, ${(1 - opacity) * 9}px, 0)`;
        element.style.setProperty("--line-progress", `${opacity}`);
      });

      messages.forEach((element, index) => {
        const center = [0.08, 0.34, 0.56, 0.78][index];
        const opacity =
          index === 0
            ? 1 - range(progress, 0.18, 0.31)
            : range(progress, center - 0.12, center - 0.03) *
              (1 - range(progress, center + 0.08, center + 0.17));
        element.style.opacity = `${opacity}`;
        element.style.transform = `translate3d(0, ${(1 - opacity) * 8}px, 0)`;
      });
      const finalOpacity = reduced.matches
        ? 1
        : range(progress, 0.83, 0.91) * (1 - range(progress, 0.97, 1) * 0.28);
      if (final) {
        final.style.opacity = `${finalOpacity}`;
        final.style.transform = `translate3d(0, ${(1 - finalOpacity) * 16}px, 0)`;
        final.style.pointerEvents = finalOpacity > 0.8 ? "auto" : "none";
      }
      if (entry) entry.style.opacity = `${1 - range(progress, 0.78, 0.9)}`;
      scene.style.opacity = `${reduced.matches ? 1 : 1 - range(progress, 0.97, 1) * 0.3}`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    observer.observe(scene);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    mobile.addEventListener("change", schedule);
    schedule();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
      mobile.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <section
      className="hero-pc-scroll"
      ref={sectionRef}
      aria-label="Explore a custom PC build"
    >
      <div className="hero-pc-sticky">
        <div className="hero-pc-layout page-width">
          <div className="hero-pc-copy">
            <span className="eyebrow">
              <span className="tiny-dot" />
              CUSTOM PC BUILDING
            </span>
            <h1>
              {title.split("\n").map((line, index) => (
                <span
                  key={line}
                  className={index === 0 ? "hero-pc-heading-lead" : ""}
                >
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
            </h1>
            <p>
              Tell us your budget and what you use your PC for. We'll help you
              create a balanced, compatible build around your needs.
            </p>
            <div className="hero-pc-entry">
              <div className="hero-actions">
                <BrandLink to="/builder" className="button primary">
                  Build My PC <ArrowUpRight size={18} />
                </BrandLink>
                <BrandLink to="/builds" className="button text">
                  Explore Ready Builds <ArrowRight size={17} />
                </BrandLink>
              </div>
              <div className="hero-trust">
                {trustPoints.slice(0, 3).map((point) => (
                  <span key={point}>{point}</span>
                ))}
              </div>
            </div>
            <div className="hero-pc-story" aria-label="Build principles">
              {story.map((message, index) => (
                <span key={message} data-story={index}>
                  {message}
                </span>
              ))}
            </div>
            <div className="hero-pc-scroll-hint" aria-hidden="true">
              <span>SCROLL TO EXPLORE</span>
              <span className="hero-pc-hint-rule" />
            </div>
          </div>

          <div className="hero-pc-visual">
            <div className="hero-pc-topline">
              <span>01 / INSIDE THE BUILD</span>
              <span>PRECISION IN EVERY PART</span>
            </div>
            <div
              className="hero-pc-scene"
              role="img"
              aria-label="Layered illustration of a custom PC opening into an exploded view"
            >
              <span className="hero-pc-stage-ring" aria-hidden="true" />
              {layers.map((layer) => (
                <img
                  key={layer.id}
                  className={`hero-pc-layer hero-pc-layer-${layer.id}`}
                  data-layer={layer.id}
                  src={layer.src}
                  alt=""
                  width="700"
                  height="700"
                  loading="eager"
                  decoding="async"
                />
              ))}
              <div
                className="hero-pc-callout hero-pc-callout-cooling"
                data-callout="cooling"
              >
                <span className="hero-pc-line" />
                <span>
                  <small>COOLING</small>
                  <strong>{heroBuild.cooling}</strong>
                </span>
              </div>
              <div
                className="hero-pc-callout hero-pc-callout-platform"
                data-callout="platform"
              >
                <span className="hero-pc-line" />
                <span>
                  <small>PLATFORM</small>
                  <strong>{heroBuild.platform}</strong>
                </span>
              </div>
              <div
                className="hero-pc-callout hero-pc-callout-memory"
                data-callout="memory"
              >
                <span className="hero-pc-line" />
                <span>
                  <small>MEMORY</small>
                  <strong>{heroBuild.memory}</strong>
                </span>
              </div>
              <div
                className="hero-pc-callout hero-pc-callout-gpu"
                data-callout="gpu"
              >
                <span className="hero-pc-line" />
                <span>
                  <small>GPU</small>
                  <strong>{heroBuild.gpu}</strong>
                </span>
              </div>
            </div>
            <div className="hero-pc-final">
              <div className="hero-pc-final-heading">
                <span className="eyebrow">BALANCED 1440P BUILD</span>
                <strong>{money(heroBuild.price)}</strong>
              </div>
              <div className="hero-pc-final-specs">
                <span>{heroBuild.cpu}</span>
                <span>{heroBuild.gpu}</span>
                <span>{heroBuild.memory}</span>
                <span>{heroBuild.storage}</span>
                <span>{heroBuild.cooling}</span>
              </div>
              <div className="hero-pc-final-bottom">
                <span>SUITED TO {heroBuild.suitability.join(" · ")}</span>
                <BrandLink to="/builder" className="button primary">
                  Build My PC <ArrowUpRight size={16} />
                </BrandLink>
              </div>
            </div>
            <span className="hero-pc-footnote">
              ILLUSTRATIVE CONFIGURATION · FINAL QUOTE CONFIRMED BY RETAILER
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
