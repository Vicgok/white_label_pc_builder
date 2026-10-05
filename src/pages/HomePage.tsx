import { ArrowRight, ArrowUpRight, Box, Check, Gamepad2, Layers3, MonitorPlay, Radio, Sparkles, BriefcaseBusiness } from 'lucide-react';
import { useBrand } from '../config/brand';
import { readyBuilds } from '../data/builds';
import { calculateBuildTotal, money } from '../domain/pricing';
import { resolveParts } from '../data/components';
import { BrandLink } from '../components/BrandLink';
import { PcVisual } from '../components/HardwareVisual';
import { ProductCallouts } from '../components/ProductCallouts';
import { BuildCard } from '../components/BuildCard';
import { useCaseLabels, useCaseDescriptions, useCases } from '../utils/catalog';
export const useCaseIcons = { gaming: Gamepad2, editing: MonitorPlay, rendering: Box, streaming: Radio, ai: Sparkles, office: BriefcaseBusiness };
export function HomePage() {
  const brand = useBrand();
  const featured = readyBuilds[1];
  const parts = resolveParts(featured.components);
  const budgets = [
    { title: 'Under ₹60K', amount: 60000, text: 'Everyday work. A first gaming PC.' },
    { title: '₹60K – ₹1L', amount: 100000, text: '1080p gaming. Everyday creation.' },
    { title: '₹1L – ₹1.5L', amount: 150000, text: 'Strong 1440p. More creative room.' },
    { title: '₹1.5L – ₹2.5L', amount: 250000, text: '4K capable. Serious creator work.' },
    { title: '₹2.5L+', amount: 350000, text: 'Big ideas. Demanding workloads.' },
  ];
  return <>
    <section className="hero page-width"><div className="hero-copy"><span className="eyebrow"><span className="tiny-dot" />{brand.hero.eyebrow}</span><h1>{brand.hero.title.split('\n').map((line, index) => <span key={line} className={index === 1 ? 'muted-heading' : ''}>{line}<br /></span>)}</h1><p>{brand.hero.description}</p><div className="hero-actions"><BrandLink to="/builder" className="button primary">Build My PC <ArrowUpRight size={18} /></BrandLink><BrandLink to="/builds" className="button text">Explore Ready Builds <ArrowRight size={17} /></BrandLink></div><div className="hero-trust">{brand.trustPoints.slice(0, 3).map(point => <span key={point}><Check size={14} />{point}</span>)}</div></div>
      <div className="hero-art"><span className="hero-art-label">PURPOSE-BUILT. BEAUTIFULLY BALANCED.</span><span className="hero-number">01 / 04</span><PcVisual priority /><ProductCallouts selectedComponents={featured.components} /><div className="hero-art-caption"><span><small>FEATURED CONFIGURATION</small><strong>{featured.name}</strong><span>{parts.memory?.capacityGb}GB {parts.memory?.memoryType} / {featured.resolution} ready · representative image</span></span><span className="hero-art-price"><small>ESTIMATED BUILD</small><strong>{money(calculateBuildTotal(featured.components))}</strong></span></div></div>
    </section>
    <div className="intro-strip"><div className="page-width"><span><Layers3 size={18} /> Less guesswork. Better balance.</span><span>Choose a purpose <ArrowRight size={14} /> Set your budget <ArrowRight size={14} /> Make it yours</span><small>Local sample catalog · prices subject to confirmation</small></div></div>
    <section className="section page-width"><div className="section-heading"><div><span className="eyebrow">01 — FIND YOUR PURPOSE</span><h2>Start with what matters.</h2></div><p>You don’t need to know every component.<br />Just tell us what you want to do.</p></div><div className="use-case-grid">{useCases.map(useCase => { const Icon = useCaseIcons[useCase]; return <BrandLink to={`/builder?useCase=${useCase}`} className="use-case-tile" key={useCase}><Icon size={25} strokeWidth={1.4} /><h3>{useCaseLabels[useCase]}</h3><p>{useCaseDescriptions[useCase]}</p><ArrowUpRight className="tile-arrow" size={17} /></BrandLink>; })}</div></section>
    <section className="budget-section"><div className="page-width section"><div className="section-heading"><div><span className="eyebrow">02 — FIND YOUR SWEET SPOT</span><h2>A great build. At your budget.</h2></div><p>A starting point for your plans.<br />We’ll balance the parts from there.</p></div><div className="budget-grid">{budgets.map((budget, index) => <BrandLink to={`/builder?budget=${budget.amount}`} key={budget.amount}><span className="budget-index">0{index + 1}</span><h3>{budget.title}</h3><p>{budget.text}</p><ArrowUpRight size={20} /></BrandLink>)}</div></div></section>
    <section className="featured-section"><div className="page-width featured-grid"><div><span className="eyebrow">THE BALANCED PERFORMER</span><h2>{featured.name}</h2><p>{featured.description}</p><div className="feature-tags"><span>1440p Gaming</span><span>Streaming</span><span>Editing</span></div><BrandLink to={`/builder?build=${featured.slug}`} className="button primary">Customize Build <ArrowUpRight size={17} /></BrandLink></div><div className="featured-art"><PcVisual /></div><div className="featured-specs">{[['PROCESSOR', parts.cpu?.name], ['GRAPHICS', parts.gpu?.name.replace(/^GeForce /, '')], ['MEMORY', parts.memory ? parts.memory.capacityGb + 'GB ' + parts.memory.memoryType : '—'], ['STORAGE', parts.storage ? (parts.storage.capacityGb >= 1000 ? parts.storage.capacityGb / 1000 + 'TB' : parts.storage.capacityGb + 'GB') + ' NVMe' : '—']].map(([title, value]) => <div key={title}><small>{title}</small><strong>{value}</strong></div>)}<div className="featured-price"><small>SAMPLE BUILD PRICE</small><strong>{money(calculateBuildTotal(featured.components))}</strong></div></div></div></section>
    <section className="section page-width"><div className="section-heading"><div><span className="eyebrow">03 — A HEAD START</span><h2>Good foundations. Yours to customize.</h2></div><BrandLink to="/builds" className="button text">All Ready Builds <ArrowRight size={17} /></BrandLink></div><div className="build-grid">{[readyBuilds[0], readyBuilds[2], readyBuilds[3]].map(build => <BuildCard key={build.slug} build={build} />)}</div></section>
    <section className="trust-section page-width"><div><span className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</span><h2>More than a parts list.</h2><p>A good PC is a system. Every choice should work with the next, and leave room for what comes after.</p><BrandLink to="/why-us" className="button text">Explore the approach <ArrowRight size={17} /></BrandLink></div><div className="trust-points">{brand.trustPoints.map((point, index) => <div key={point}><span>0{index + 1}</span><h3>{point}</h3><Check size={18} /></div>)}</div></section>
  </>;
}
