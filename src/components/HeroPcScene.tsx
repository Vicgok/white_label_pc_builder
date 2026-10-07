import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { heroStoryIndex, heroStoryStages, mobileHeroStoryStages } from '../config/hero-story';
import { prefetch3DDemo } from './PreviewFlagship';
import { ThreeDLoadingState } from './three/ThreeDLoadingState';
import { PreviewUnavailable } from './three/Loading3D';
import type { HeroScrollState } from '../domain/three/homepage-explosion';
import './HeroPcScene.css';

const loadHero = () => import('./three/HeroPc3D');
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function HeroPcScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const scroll = useRef<HeroScrollState>({ progress: 0, active: false });
  const [active, setActive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    mobile: window.matchMedia('(max-width: 767px)').matches,
    tablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  const Scene = useMemo(() => lazy(loadHero), [attempt]);
  const stages = viewport.mobile ? mobileHeroStoryStages : heroStoryStages;

  useEffect(() => {
    const section = sectionRef.current!;
    const stories = Array.from(section.querySelectorAll<HTMLElement>('[data-story]'));
    const indicator = section.querySelector<HTMLElement>('.hero-pc-story-progress')!;
    const media = [window.matchMedia('(max-width: 767px)'), window.matchMedia('(min-width: 768px) and (max-width: 1023px)'), window.matchMedia('(prefers-reduced-motion: reduce)')];
    let frame = 0, top = 0, travel = 1, currentStage = -1;
    const draw = () => {
      frame = 0;
      const progress = viewport.reduced ? 0 : clamp((window.scrollY - top) / travel);
      scroll.current.progress = progress;
      if (scroll.current.active) scroll.current.invalidate?.();
      const nextStage = heroStoryIndex(progress, stages);
      // Only touch the copy at stage boundaries. CSS handles its crossfade;
      // scroll frames and story changes never rerender the Three.js canvas.
      if (nextStage !== currentStage) {
        stories.forEach((story, index) => {
          story.dataset.state = index === nextStage ? 'active' : index < nextStage ? 'past' : 'next';
          story.setAttribute('aria-hidden', String(index !== nextStage));
          story.inert = index !== nextStage;
        });
        indicator.textContent = `${String(nextStage + 1).padStart(2, '0')} / ${String(stages.length).padStart(2, '0')} — ${stages[nextStage].label}`;
        currentStage = nextStage;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, section.offsetHeight - window.innerHeight);
      schedule();
    };
    const update = () => setViewport({ mobile: media[0].matches, tablet: media[1].matches, reduced: media[2].matches });
    const resize = new ResizeObserver(measure);
    resize.observe(section);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    media.forEach(query => query.addEventListener('change', update));
    measure();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      media.forEach(query => query.removeEventListener('change', update));
    };
  }, [viewport.reduced, stages]);

  useEffect(() => {
    let paint = 0;
    const observer = new IntersectionObserver(entries => {
      scroll.current.active = entries.some(entry => entry.isIntersecting);
      if (scroll.current.active) {
        setActive(true);
        scroll.current.invalidate?.();
      }
    });
    // Keep the first paint and primary CTA independent of the Three.js chunk.
    const first = requestAnimationFrame(() => {
      paint = requestAnimationFrame(() => { if (sectionRef.current) observer.observe(sectionRef.current); });
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(paint); observer.disconnect(); scroll.current.active = false; };
  }, []);

  return <section className="hero-pc-scroll" ref={sectionRef} aria-label="Explore a custom PC build">
    <div className="hero-pc-sticky">
      <div className="hero-pc-layout page-width">
        <div className="hero-pc-story">
          <div className="hero-pc-story-stack">
            {stages.map((stage, index) => {
              const Heading = index === 0 ? 'h1' : 'h2';
              return <section key={stage.id} data-story={stage.id} data-state={index === 0 ? 'active' : 'next'}
                className={`hero-pc-story-stage${index === 0 ? ' hero-pc-copy' : ''}${stage.actions === 'final' ? ' hero-pc-final' : ''}`}
                aria-label={stage.actions === 'final' ? 'Interactive 3D Preview invitation' : `${stage.label} your PC`}
                aria-hidden={index !== 0} inert={index !== 0}>
                <span className="eyebrow">{stage.eyebrow}</span>
                <Heading>{stage.title.split('\n').map((line, lineIndex) => <span key={line} className={index === 0 && lineIndex === 0 ? 'hero-pc-heading-lead' : ''}>{line}{lineIndex === 0 && stage.title.includes('\n') && <>{index !== 0 && ' '}<br /></>}</span>)}</Heading>
                <p>{stage.description}</p>
                {stage.details && <ul className="hero-pc-story-details">{stage.details.map(detail => <li key={detail}>{stage.checked && <span aria-hidden="true">✓</span>}{detail}</li>)}</ul>}
                {stage.actions === 'final' && <div className="hero-pc-final-specs"><span>Representative build</span><p>Ryzen 7 9700X <span> / </span> RTX 5070<br /> 32GB DDR5 <span> / </span> 1TB NVMe</p></div>}
                {stage.actions && <div className="hero-actions">
                  <Link to="/builder" className="button primary">{stage.actions === 'intro' ? 'Start Building' : 'Build My PC'} <ArrowUpRight size={18} /></Link>
                  <a href="#3d-preview" className="button text" onPointerEnter={prefetch3DDemo} onFocus={prefetch3DDemo}>{stage.actions === 'intro' ? 'Explore 3D Preview' : 'Open 3D Preview'} <ArrowRight size={17} /></a>
                </div>}
              </section>;
            })}
          </div>
          <span className="hero-pc-story-progress" aria-hidden="true">01 / {String(stages.length).padStart(2, '0')} — Build</span>
        </div>
        <div className="hero-pc-visual">
          <div className="hero-pc-scene" data-ready={ready} role="group" aria-label="Three-dimensional custom PC; the case opens before its components separate as you scroll">
            {!active && <ThreeDLoadingState compact label="Preparing interactive 3D…" />}
            {active && <HeroBoundary key={attempt} onRetry={() => { setReady(false); setAttempt(value => value + 1); }}>
              <Suspense fallback={<ThreeDLoadingState compact label="Preparing interactive 3D…" />}>
                <Scene scroll={scroll} mobile={viewport.mobile} tablet={viewport.tablet} reducedMotion={viewport.reduced} onReady={setReady} />
              </Suspense>
            </HeroBoundary>}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

// Kept outside the lazy chunk so a failed download leaves the CTAs usable.
class HeroBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <PreviewUnavailable compact onRetry={this.props.onRetry} returnHref="/builder" /> : this.props.children;
  }
}
