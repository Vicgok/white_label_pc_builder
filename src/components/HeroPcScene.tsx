import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { productConfig } from "../config/product";
import { calculateBuildTotal, money } from "../domain/pricing";
import { serializeBuild } from "../domain/build-serialization";
import { resolveParts } from "../data/components";
import { readyBuilds } from "../data/builds";
import "./HeroPcScene.css";

const assetRoot = "/assets/hero-pc";
const assembledImage = `${assetRoot}/assembled/pc.webp`;
const layerIds = ["case", "motherboard", "storage", "psu", "ram", "cooler", "gpu"] as const;
type LayerId = typeof layerIds[number];
const selectedComponents = { ...readyBuilds[1].components, cooling: "cool-240" };
const parts = resolveParts(selectedComponents);
export const heroBuild = {
  name: readyBuilds[1].name,
  cpu: parts.cpu!.name,
  gpu: parts.gpu!.name.replace(/^GeForce /, "").replace(/ \d+GB$/, ""),
  memory: `${parts.memory!.capacityGb}GB ${parts.memory!.memoryType}`,
  storage: `${parts.storage!.capacityGb / 1000}TB NVMe`,
  price: calculateBuildTotal(selectedComponents),
};
const customizeUrl = `/builder?shared=${encodeURIComponent(serializeBuild({
  buildId: "PC-HERO1440", useCase: "gaming", budget: heroBuild.price, resolution: "1440p",
  selectedComponents, savedAt: null,
}))}`;

type Motion = { start: number; end: number; x: number; y: number };
const desktopMotion: Record<LayerId, Motion> = {
  case: { start: 0, end: 1, x: 0, y: 0 },
  gpu: { start: .18, end: .52, x: 150, y: 10 },
  cooler: { start: .25, end: .58, x: -70, y: -105 },
  motherboard: { start: .34, end: .68, x: -105, y: 5 },
  ram: { start: .44, end: .72, x: 15, y: -60 },
  psu: { start: .52, end: .8, x: -100, y: 55 },
  storage: { start: .62, end: .82, x: 65, y: 45 },
};
const mobileMotion: Record<LayerId, Motion> = {
  ...desktopMotion,
  gpu: { start: .18, end: .6, x: 70, y: 10 },
  cooler: { start: .25, end: .68, x: -25, y: -55 },
  motherboard: { start: .34, end: .76, x: -45, y: 5 },
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start));

export function HeroPcScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState(() => ({
    mobile: window.matchMedia("(max-width: 767px)").matches,
    tablet: window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  const visibleLayers = viewport.reduced ? [] : layerIds.filter(id =>
    !viewport.mobile || ["case", "motherboard", "cooler", "gpu"].includes(id));
  const layerSrc = (id: LayerId) => `${assetRoot}/layers/hero-${viewport.mobile && (id === "case" || id === "motherboard") ? id + "-mobile" : id}.webp`;

  useEffect(() => {
    const section = sectionRef.current!;
    const scene = section.querySelector<HTMLElement>(".hero-pc-scene")!;
    const copy = section.querySelector<HTMLElement>(".hero-pc-copy")!;
    const summary = section.querySelector<HTMLElement>(".hero-pc-final")!;
    const images = Array.from(scene.querySelectorAll<HTMLElement>("[data-layer]"));
    const mobile = window.matchMedia("(max-width: 767px)");
    const tablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, disposed = false, top = 0, travel = 1, distanceScale = 1;
    delete scene.dataset.ready;
    // Framer Motion isn't installed. Retain the existing RAF renderer: no React
    // state updates during scroll, and layout is measured only on resize.
    const motion = viewport.mobile ? mobileMotion : desktopMotion;
    const draw = () => {
      frame = 0;
      const progress = viewport.reduced ? 0 : clamp((window.scrollY - top) / travel);
      images.forEach(element => {
        const item = motion[element.dataset.layer as LayerId];
        const raw = range(progress, item.start, item.end);
        const t = raw * raw * (3 - 2 * raw);
        element.style.transform = `translate3d(${item.x * distanceScale * t}px, ${item.y * distanceScale * t}px, 0)`;
        element.style.willChange = progress > item.start && progress < item.end && element.dataset.layer !== "case" ? "transform" : "auto";
      });
      const exit = range(progress, .94, 1);
      scene.style.transform = `scale(${1.16 * (1 - .03 * exit)})`;
      scene.style.opacity = String(1 - .15 * exit);
      const copyOpacity = viewport.reduced ? 1 : 1 - .65 * range(progress, .2, .45) - .35 * range(progress, .6, .76);
      copy.style.opacity = String(copyOpacity);
      copy.style.visibility = copyOpacity === 0 ? "hidden" : "visible";
      copy.inert = copyOpacity < .2;
      const reveal = viewport.reduced ? 1 : range(progress, .78, .92);
      summary.style.opacity = String(reveal);
      summary.style.visibility = reveal === 0 ? "hidden" : "visible";
      summary.inert = reveal < .9;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, section.offsetHeight - window.innerHeight);
      distanceScale = scene.clientWidth / 700 * (viewport.tablet ? .7 : 1);
      schedule();
    };
    const updateViewport = () => setViewport({ mobile: mobile.matches, tablet: tablet.matches, reduced: reduced.matches });
    const observer = new ResizeObserver(measure);
    observer.observe(section); observer.observe(scene);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    mobile.addEventListener("change", updateViewport);
    tablet.addEventListener("change", updateViewport);
    reduced.addEventListener("change", updateViewport);
    // A failed image hides only that layer. Available hardware keeps moving.
    Promise.allSettled(Array.from(scene.querySelectorAll("img")).map(async image => {
      try { await image.decode(); } catch { if (!disposed) image.hidden = true; }
    })).then(() => {
      if (!disposed) { scene.dataset.ready = "true"; schedule(); }
    });
    measure();
    return () => {
      disposed = true; if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", measure);
      mobile.removeEventListener("change", updateViewport); tablet.removeEventListener("change", updateViewport); reduced.removeEventListener("change", updateViewport);
    };
  }, [viewport.mobile, viewport.tablet, viewport.reduced]);

  return <>
    {viewport.reduced && <link rel="preload" as="image" type="image/webp" href={assembledImage} />}
    {visibleLayers.map(id => <link key={id} rel="preload" as="image" type="image/webp" href={layerSrc(id)} />)}
    <section className="hero-pc-scroll" ref={sectionRef} aria-label="Explore a custom PC build">
      <div className="hero-pc-sticky">
        <div className="hero-pc-layout page-width">
          <div className="hero-pc-copy">
            <span className="eyebrow">{productConfig.hero.eyebrow}</span>
            <h1>{productConfig.hero.title.split("\n").map((line, index) => <span key={line} className={index === 0 ? "hero-pc-heading-lead" : ""}>{line}{index === 0 && <br />}</span>)}</h1>
            <p>{productConfig.hero.description}</p>
            <div className="hero-actions">
              <Link to="/builder" className="button primary">Build My PC <ArrowUpRight size={18} /></Link>
              <Link to="/builds" className="button text">Explore Ready Builds <ArrowRight size={17} /></Link>
            </div>
            <span className="hero-pc-scroll-hint">SCROLL TO EXPLORE</span>
          </div>
          <div className="hero-pc-visual">
            <div className="hero-pc-scene" role="img" aria-label={!viewport.reduced ? "Photographic custom desktop PC with components carefully separating as you scroll" : "Studio product photograph of an assembled black custom desktop PC"}>
              {viewport.reduced && <img className="hero-pc-assembled" src={assembledImage} alt="" width="1600" height="1600" loading="eager" fetchPriority="high" decoding="async" />}
              {visibleLayers.length > 0 && <div className="hero-pc-layer-stack">
                {visibleLayers.map(id => <img key={id} className={`hero-pc-layer hero-pc-layer-${id}`} data-layer={id} src={layerSrc(id)} alt="" width="1600" height="1600" loading="eager" fetchPriority={id === "case" ? "high" : "auto"} decoding="async" onLoad={event => { event.currentTarget.hidden = false; }} onError={event => { event.currentTarget.hidden = true; }} />)}
              </div>}
            </div>
          </div>
          <section className="hero-pc-final" aria-label="Featured build summary">
            <span className="eyebrow">VORTEX 1440</span>
            <h2>Built around your next move.</h2>
            <p>A balanced starting point for 1440p gaming.</p>
            <ul className="hero-pc-final-specs">
              {[heroBuild.cpu, heroBuild.gpu, heroBuild.memory, heroBuild.storage].map(value => <li key={value}>{value}</li>)}
            </ul>
            <div className="hero-pc-final-bottom">
              <div><strong>{money(heroBuild.price)}</strong><small>Sample price · final quote confirmed by retailer</small></div>
              <Link to={customizeUrl} className="button primary">Customize Build <ArrowUpRight size={16} /></Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  </>;
}
