import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Move3D, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loading3D, PreviewErrorBoundary } from './three/Loading3D';
import './three/Pc3DPreview.css';
import './PreviewFlagship.css';

const loadDemo = () => import('./three/PcDemo');
export function prefetch3DDemo() { void loadDemo().catch(() => {}); }

export function PreviewFlagship() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const Demo = useMemo(() => lazy(loadDemo), [attempt]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { prefetch3DDemo(); observer.disconnect(); }
    }, { rootMargin: '250px' });
    const observe = () => { if (section.current) observer.observe(section.current); };
    // Even a shorter reduced-motion hero must leave the first paint free of Three.js.
    if (window.scrollY > 0 || window.location.hash === '#3d-preview') observe();
    else window.addEventListener('scroll', observe, { once: true, passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', observe); };
  }, []);
  const close = () => setActive(false);
  return <section id="3d-preview" ref={section} className="preview-flagship" aria-labelledby="preview-flagship-title">
    <div className="page-width preview-flagship-inner">
      <div className="preview-flagship-heading"><span className="eyebrow">3D BUILD PREVIEW</span><span className="preview-beta">BETA</span></div>
      <div className="preview-flagship-grid">
        <div className="preview-demo-stage">
          {active ? <PreviewErrorBoundary key={attempt} onRetry={() => setAttempt(value => value + 1)} onParts={close}
            returnLabel="Back to demo" description="You can continue configuring your PC in the builder.">
            <Suspense fallback={<Loading3D />}><Demo onClose={close} /></Suspense>
          </PreviewErrorBoundary> : <button className="preview-demo-poster" onClick={() => setActive(true)}
            onPointerEnter={prefetch3DDemo} onFocus={prefetch3DDemo} aria-label="Explore in 3D">
            <img src="/assets/hero-pc/assembled/pc.webp" alt="Black panoramic PC ready to inspect" loading="lazy" width="1600" height="1600" />
            <span className="preview-demo-invitation"><Play size={17} />Explore in 3D <span>Drag. Inspect. Discover.</span></span>
          </button>}
        </div>
        <div className="preview-flagship-copy">
          <Move3D size={28} strokeWidth={1.2} aria-hidden="true" />
          <h2 id="preview-flagship-title">Don’t imagine your build.<br /><span>Inspect it.</span></h2>
          <p>See how your selected components come together inside the system. Explore the machine before finalizing your configuration.</p>
          <dl className="preview-capabilities">
            <div><dt>ROTATE</dt><dd>View your build from every angle.</dd></div>
            <div><dt>INSPECT</dt><dd>Remove the glass. Select the hardware inside.</dd></div>
            <div><dt>EXPLODE</dt><dd>Separate the build into its major parts.</dd></div>
            <div><dt>CHECK</dt><dd>Pair the preview with compatibility checks.</dd></div>
          </dl>
          <Link to="/builder?view=3d" className="button primary">Try 3D Builder <ArrowUpRight size={17} /></Link>
        </div>
      </div>
      <p className="preview-flagship-note">3D Preview is representative. Exact component appearance and placement may vary.</p>
    </div>
  </section>;
}
