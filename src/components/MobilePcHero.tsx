import { ArrowRight, ArrowUpRight, CheckCircle2, Move3D } from 'lucide-react';
import { Link } from 'react-router-dom';
import { readyBuilds } from '../data/builds';
import { resolveParts } from '../data/components';
import { validateBuild } from '../domain/compatibility';
import { calculateBuildTotal, money } from '../domain/pricing';
import './MobilePcHero.css';

// A catalog example, not the visitor's persisted builder draft.
const example = readyBuilds.find(build => build.slug === 'vortex-1440')!;
const parts = resolveParts(example.components);
const checked = validateBuild(parts);
const compatible = checked.complete && checked.issues.length === 0;

/** Mobile marketing only: one product photograph, real HTML, no render loop. */
export function MobilePcHero() {
  return <section className="mobile-pc-hero" aria-labelledby="mobile-pc-hero-title">
    <div className="mobile-pc-hero-inner">
      <div className="mobile-pc-hero-copy">
        <span className="eyebrow">INTERACTIVE PC BUILDING</span>
        <h1 id="mobile-pc-hero-title">Build it.<br /><span>See it before you buy it.</span></h1>
        <p>Choose your parts, check compatibility, and explore the finished build in interactive 3D before you finalize it.</p>
        <Link to="/builder" className="button primary mobile-pc-hero-start">Start Building <ArrowUpRight size={18} aria-hidden="true" /></Link>
        <Link to="/how-it-works" className="mobile-pc-hero-how">See how it works <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>

      <figure className="mobile-pc-hero-visual">
        <img src="/assets/hero-pc/assembled/pc.webp" width="1600" height="1600"
          alt="Black showcase PC in a three-quarter view, with its graphics card, memory and liquid cooling visible"
          loading="eager" fetchPriority="high" decoding="async" />
      </figure>

      <div className="mobile-pc-hero-build" aria-label="Example build from the RigPilot catalog">
        <div className="mobile-pc-hero-build-heading"><span>EXAMPLE BUILD</span><span>Illustrative pricing</span></div>
        <dl className="mobile-pc-hero-specs">
          <div><dt>PROCESSOR</dt><dd>{parts.cpu?.name}</dd></div>
          <div><dt>GRAPHICS</dt><dd>RTX 5070</dd></div>
          <div><dt>MEMORY</dt><dd>{parts.memory?.capacityGb}GB {parts.memory?.memoryType}</dd></div>
        </dl>
        <div className="mobile-pc-hero-build-bottom">
          <span className={compatible ? 'status-success' : 'status-warning'}><CheckCircle2 size={14} aria-hidden="true" />{compatible ? 'All major components compatible' : 'Review compatibility in builder'}</span>
          <strong>{money(calculateBuildTotal(example.components))}</strong>
        </div>
      </div>

      <Link to="/builder?view=3d" className="mobile-pc-hero-preview">
        <Move3D size={22} strokeWidth={1.5} aria-hidden="true" />
        <span><span className="eyebrow">3D PREVIEW</span><span className="mobile-pc-hero-preview-description">Rotate, inspect and explode your build inside the builder.</span><span className="mobile-pc-hero-preview-action">Explore 3D Preview <ArrowRight size={14} aria-hidden="true" /></span></span>
      </Link>
    </div>
  </section>;
}
