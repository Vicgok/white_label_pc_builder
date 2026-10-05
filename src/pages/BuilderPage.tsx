import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Circle, Search, SlidersHorizontal, TriangleAlert, X } from 'lucide-react';
import { categories, type ComponentCategory } from '../types';
import { useBuilderStore, newBuildId } from '../store/builderStore';
import { getComponents, resolveParts } from '../data/components';
import { readyBuilds } from '../data/builds';
import { deserializeBuild } from '../domain/build-serialization';
import { checkCaseCompatibility, checkCoolerCompatibility, checkCpuMotherboardCompatibility, checkMemoryCompatibility, checkPsuCompatibility, validateBuild } from '../domain/compatibility';
import { calculateBuildTotal, money } from '../domain/pricing';
import { categoryLabels, categoryTitles, componentSpecs, useCases } from '../utils/catalog';
import { useBrandPath } from '../components/BrandLink';
import { categoryIcons, PartVisual } from '../components/HardwareVisual';
import { BuildSummary } from '../components/builder/BuildSummary';
import { Onboarding } from '../components/builder/Onboarding';
import { Dialog, EmptyState, useToast } from '../components/ui';
import type { BuildParts } from '../types';

function candidateIssues(category: ComponentCategory, parts: BuildParts) {
  switch (category) {
    case 'cpu': return [...checkCpuMotherboardCompatibility(parts), ...checkMemoryCompatibility(parts), ...checkCoolerCompatibility(parts), ...checkPsuCompatibility(parts)];
    case 'motherboard': return [...checkCpuMotherboardCompatibility(parts), ...checkMemoryCompatibility(parts), ...checkCaseCompatibility(parts).filter(i => i.code === 'form-factor')];
    case 'gpu': return [...checkCaseCompatibility(parts).filter(i => i.code === 'gpu-length'), ...checkPsuCompatibility(parts)];
    case 'memory': return checkMemoryCompatibility(parts);
    case 'case': return [...checkCaseCompatibility(parts), ...checkCoolerCompatibility(parts).filter(i => ['cooler-height', 'radiator'].includes(i.code))];
    case 'cooling': return checkCoolerCompatibility(parts);
    case 'psu': return checkPsuCompatibility(parts);
    default: return [];
  }
}
export function BuilderPage() {
  const build = useBuilderStore();
  const location = useLocation();
  const navigate = useNavigate();
  const brandPath = useBrandPath();
  const initialized = useRef('');
  const { toast } = useToast();
  const [category, setCategory] = useState<ComponentCategory>('cpu');
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [socketFilter, setSocketFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('all');
  const [sort, setSort] = useState('recommended');
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [invalid, setInvalid] = useState('');
  useEffect(() => {
    if (initialized.current === location.search) return;
    initialized.current = location.search;
    const params = new URLSearchParams(location.search);
    const shared = params.get('shared');
    const ready = params.get('build');
    setInvalid('');
    if (shared) {
      const parsed = deserializeBuild(shared);
      if (parsed) { useBuilderStore.getState().loadBuild(parsed); toast(`Shared build ${parsed.buildId} loaded.`); navigate(brandPath('/builder'), { replace: true }); }
      else setInvalid('This shared build link is invalid or uses parts that are no longer in the sample catalog. Your current build is safe.');
    } else if (ready) {
      const preset = readyBuilds.find(b => b.slug === ready);
      if (preset) { useBuilderStore.getState().loadBuild({ buildId: newBuildId(), useCase: preset.useCases[0], budget: calculateBuildTotal(preset.components), resolution: preset.resolution, selectedComponents: preset.components, savedAt: null }); navigate(brandPath('/builder'), { replace: true }); }
      else setInvalid('That ready build could not be found. Start a new build or continue your draft.');
    } else if (params.has('useCase') || params.has('budget')) {
      const state = useBuilderStore.getState();
      state.resetBuild();
      const useCase = params.get('useCase');
      const budget = Number(params.get('budget'));
      if (useCases.includes(useCase as typeof useCases[number])) state.setUseCase(useCase as typeof useCases[number]);
      if (params.has('budget') && Number.isFinite(budget) && budget >= 10000 && budget <= 1000000) state.setBudget(budget);
      navigate(brandPath('/builder'), { replace: true });
    }
    const requestedCategory = params.get('category');
    if (categories.includes(requestedCategory as ComponentCategory)) { setCategory(requestedCategory as ComponentCategory); useBuilderStore.getState().startBuild(); navigate(brandPath('/builder'), { replace: true }); }
  }, [location.search, toast]);
  const selectCategory = (next: ComponentCategory, onlyCompatible = false) => { setCategory(next); setSearch(''); setBrandFilter('all'); setSocketFilter('all'); setMaxPrice('all'); setCompatibleOnly(onlyCompatible); setReviewOpen(false); };
  const adjust = () => { useBuilderStore.setState({ started: false }); navigate(brandPath('/builder'), { replace: true }); };
  const parts = resolveParts(build.selectedComponents);
  const validation = validateBuild(parts);
  const brands = [...new Set(getComponents(category).map(c => c.brand))];
  const available = getComponents(category).map(part => ({ part, issues: candidateIssues(category, resolveParts({ ...build.selectedComponents, [category]: part.id })) }));
  const filtered = available.filter(({ part, issues }) => `${part.brand} ${part.name} ${componentSpecs(part)}`.toLowerCase().includes(search.toLowerCase()) && (brandFilter === 'all' || part.brand === brandFilter) && (socketFilter === 'all' || ('socket' in part && part.socket === socketFilter)) && (maxPrice === 'all' || part.price <= Number(maxPrice)) && (!compatibleOnly || issues.length === 0)).sort((a, b) => sort === 'price-low' ? a.part.price - b.part.price : sort === 'price-high' ? b.part.price - a.part.price : Number(b.part.tags.includes('Recommended')) - Number(a.part.tags.includes('Recommended')) || a.part.price - b.part.price);
  const clearFilters = () => { setSearch(''); setBrandFilter('all'); setSocketFilter('all'); setMaxPrice('all'); setCompatibleOnly(false); };
  const filters = <div className="workspace-filters"><label>Brand<select value={brandFilter} onChange={event => setBrandFilter(event.target.value)}><option value="all">All brands</option>{brands.map(brand => <option key={brand}>{brand}</option>)}</select></label>{['cpu', 'motherboard'].includes(category) && <label>Socket<select value={socketFilter} onChange={event => setSocketFilter(event.target.value)}><option value="all">All sockets</option><option>AM5</option><option>AM4</option><option>LGA1700</option></select></label>}<label>Price<select value={maxPrice} onChange={event => setMaxPrice(event.target.value)}><option value="all">Any price</option>{[5000, 10000, 20000, 40000, 80000, 150000].map(price => <option value={price} key={price}>Under {money(price)}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" checked={compatibleOnly} onChange={event => setCompatibleOnly(event.target.checked)} />Compatible only</label></div>;
  return <>
    {invalid && <div className="invalid-share" role="alert"><TriangleAlert size={19} /><p>{invalid}</p><button className="button outline" onClick={() => { setInvalid(''); navigate(brandPath('/builder'), { replace: true }); }}>Continue building</button></div>}
    {!build.started ? <Onboarding onDone={message => setExplanation(message || '')} /> : <>
      <div className="workspace-toolbar"><div><span className="eyebrow">MAKE IT YOURS</span><h1>Build a PC<span className="workspace-title-dot">.</span></h1></div><div><span>Budget <b>{money(build.budget)}</b></span><button className="button outline" onClick={adjust}>Adjust brief</button><button className="button text" onClick={() => { build.resetBuild(); setExplanation(''); navigate(brandPath('/builder'), { replace: true }); }}>Start over</button></div></div>
      {explanation && <div className="recommendation-note"><WandNote /><p>{explanation}</p><button className="icon-button" aria-label="Dismiss recommendation explanation" onClick={() => setExplanation('')}><X size={16} /></button></div>}
      <div className="builder-layout"><nav className="category-nav" aria-label="Component categories"><span className="eyebrow">COMPONENTS</span>{categories.map(item => { const Icon = categoryIcons[item]; const selected = parts[item]; const warning = validation.issues.some(issue => issue.category === item); return <button key={item} className={category === item ? 'active' : ''} aria-current={category === item ? 'step' : undefined} onClick={() => selectCategory(item)}><Icon size={18} strokeWidth={1.5} /><span><strong>{categoryLabels[item]}</strong><small>{selected?.name || (item === 'gpu' && parts.cpu?.integratedGraphics ? 'Integrated graphics' : 'Select a component')}</small></span>{warning ? <TriangleAlert className="warning-text" size={14} /> : selected ? <Check size={14} className="status-success" /> : <Circle size={10} />}</button>; })}<div className="category-nav-note">A balanced build is more than a collection of parts.</div></nav>
      <section className="component-workspace"><div className="workspace-heading"><div><h2>{categoryTitles[category]}</h2><p>{filtered.length} options · sample catalog</p></div><label className="sort-label"><span className="sr-only">Sort components</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price Low–High</option><option value="price-high">Price High–Low</option></select></label></div><div className="search-row"><label className="search-input"><Search size={18} /><span className="sr-only">Search components</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${categoryTitles[category].toLowerCase()}…`} /></label><button className="button outline mobile-filter-button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17} />Filters</button></div><div className="desktop-filters">{filters}</div>{category === 'gpu' && parts.cpu?.integratedGraphics && <p className="integrated-note">Your CPU has integrated graphics. A dedicated GPU is optional for basic desktop use.</p>}
      <div className="component-grid">{filtered.map(({ part, issues }) => { const selected = build.selectedComponents[category] === part.id; return <article key={part.id} className={`component-card ${selected ? 'selected' : ''}`}><div className="component-image"><PartVisual component={part} />{part.tags.includes('Recommended') && <span className="recommend-tag">RECOMMENDED</span>}{selected && <span className="selected-mark"><Check size={15} /></span>}</div><div className="component-card-body"><span className="component-brand">{part.brand}</span><h3>{part.name}</h3><p>{componentSpecs(part)}</p><div className={`component-status ${issues.length ? 'warning-text' : 'status-success'}`}>{issues.length ? <TriangleAlert size={12} /> : <Check size={12} />}{issues.length ? `${issues.length} compatibility ${issues.length === 1 ? 'notice' : 'notices'}` : 'Compatible with your selections'}</div>{issues.length > 0 && <span className="candidate-issue">{issues[0].title}</span>}<div className="component-card-bottom"><strong>{money(part.price)}</strong><button className={`button ${selected ? 'outline' : 'primary'}`} aria-pressed={selected} aria-label={`${selected ? 'Selected' : 'Select'} ${part.name}`} onClick={() => { build.selectComponent(category, part.id); if (!selected) toast(`${part.name} selected.`); }}>{selected ? <><Check size={14} />Selected</> : 'Select'}</button></div></div></article>; })}</div>{filtered.length === 0 && <EmptyState title={compatibleOnly ? 'No compatible parts in this view.' : 'No matching components.'} description="Try clearing a filter, or change another component to open up your options."><button className="button outline" onClick={clearFilters}>Clear filters</button></EmptyState>}<p className="catalog-note">Specifications and prices are illustrative. Final BIOS support, connectors and availability need retailer confirmation.</p></section><aside className="desktop-summary"><BuildSummary onCategory={selectCategory} /></aside></div>
      <div className="mobile-build-bar"><div><small>ESTIMATED TOTAL</small><strong>{money(calculateBuildTotal(build.selectedComponents))}</strong></div><button className="button primary" onClick={() => setReviewOpen(true)}>Review Build <ChevronRight size={17} /></button></div>
      {reviewOpen && <Dialog dark sheet title="Review your build" onClose={() => setReviewOpen(false)}><BuildSummary onCategory={selectCategory} onGetBuild={() => setReviewOpen(false)} /></Dialog>}
      {filtersOpen && <Dialog dark sheet title="Filter components" onClose={() => setFiltersOpen(false)}>{filters}<button className="button primary full" onClick={() => setFiltersOpen(false)}>Show {filtered.length} components</button></Dialog>}
    </>}
  </>;
}
function WandNote() { return <SlidersHorizontal size={17} />; }
