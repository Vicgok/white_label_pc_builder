import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { useParams } from "react-router-dom";
import { readyBuilds } from "../data/builds";
import { resolveParts } from "../data/components";
import { calculateBuildTotal, money } from "../domain/pricing";
import { estimateSuitability } from "../domain/suitability";
import {
  categoryLabels,
  componentSpecs,
  useCaseLabels,
} from "../utils/catalog";
import { categories } from "../types";
import { Link } from "react-router-dom";
import { PcVisual } from "../components/HardwareVisual";
import { ProductCallouts } from "../components/ProductCallouts";
import { useEnquiry } from "../components/Enquiry";
import { newBuildId } from "../store/builderStore";
import { EmptyState } from "../components/ui";
import { productConfig } from "../config/product";
export function BuildDetailPage() {
  const { slug } = useParams();
  const build = readyBuilds.find((build) => build.slug === slug);
  const { openQuote } = useEnquiry();
  if (!build)
    return (
      <div className="page-width section">
        <EmptyState
          title="This build is not in the catalog."
          description="Explore one of our current sample configurations."
        >
          <Link className="button primary" to="/builds">
            Explore Ready Builds
          </Link>
        </EmptyState>
      </div>
    );
  const parts = resolveParts(build.components);
  const total = calculateBuildTotal(build.components);
  return (
    <div className="page-width detail-page">
      <Link to="/builds" className="back-link">
        <ArrowLeft size={16} />
        All Ready Builds
      </Link>
      <div className="detail-hero">
        <div className="detail-visual">
          <PcVisual priority />
          <ProductCallouts selectedComponents={build.components} />
          <span className="eyebrow">PURPOSE-BUILT / {build.resolution}</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{build.class} SERIES</span>
          <h1>{build.name}</h1>
          <p>{build.description}</p>
          <div className="feature-tags light">
            {build.useCases.map((useCase) => (
              <span key={useCase}>{useCaseLabels[useCase]}</span>
            ))}
          </div>
          <strong className="detail-price">{money(total)}</strong>
          <small className="price-disclaimer">
            {productConfig.pricingDisclaimer}
          </small>
          <div className="detail-actions">
            <Link
              className="button primary"
              to={`/builder?build=${build.slug}`}
            >
              Customize this Build <ArrowUpRight size={17} />
            </Link>
            <button
              className="button secondary"
              onClick={() =>
                openQuote({
                  buildId: newBuildId(),
                  useCase: build.useCases[0],
                  budget: total,
                  resolution: build.resolution,
                  selectedComponents: build.components,
                  savedAt: null,
                })
              }
            >
              Request a Quote
            </button>
          </div>
          <span className="status-success">
            <Check size={15} />
            Compatible across modeled properties
          </span>
        </div>
      </div>
      <div className="detail-grid">
        <section>
          <span className="eyebrow">UNDER THE HOOD</span>
          <h2>The configuration.</h2>
          <div className="configuration-table">
            {categories.map((category) => {
              const part = parts[category];
              return (
                part && (
                  <div key={category}>
                    <span>{categoryLabels[category]}</span>
                    <div>
                      <strong>
                        {part.brand} {part.name}
                      </strong>
                      <small>{componentSpecs(part)}</small>
                    </div>
                    <b>{money(part.price)}</b>
                  </div>
                )
              );
            })}
          </div>
        </section>
        <section className="detail-suitability">
          <span className="eyebrow">WHAT IT’S MADE FOR</span>
          <h2>Estimated workload suitability</h2>
          {estimateSuitability(build.components).map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
          <small>
            Heuristic estimates, not measured benchmarks or FPS claims.
          </small>
        </section>
      </div>
      <div className="detail-bottom">
        <section>
          <h2>Why this configuration works.</h2>
          <p>
            The {parts.cpu?.name} and {parts.gpu?.name} form the core of this{" "}
            {build.class.toLowerCase()} configuration. Matching memory, modeled
            power headroom and case clearances provide a balanced foundation.
          </p>
          <p>
            Exact BIOS support, connector requirements and assembly details
            should be confirmed with your retailer.
          </p>
        </section>
        <section>
          <h2>Room to grow.</h2>
          <p>{build.upgrade}</p>
          <Link
            to={`/builder?build=${build.slug}`}
            className="button text"
          >
            Explore your options <ArrowUpRight size={17} />
          </Link>
        </section>
      </div>
    </div>
  );
}
