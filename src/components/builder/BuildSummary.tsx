import {
  Check,
  ChevronRight,
  Copy,
  Save,
  Share2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useBuilderStore } from "../../store/builderStore";
import { productConfig } from "../../config/product";
import { categories, type ComponentCategory } from "../../types";
import { resolveParts } from "../../data/components";
import { validateBuild } from "../../domain/compatibility";
import { estimatePower } from "../../domain/power";
import { calculateBuildTotal, money } from "../../domain/pricing";
import { estimateSuitability } from "../../domain/suitability";
import { categoryLabels, useCaseLabels } from "../../utils/catalog";
import { useBuildActions } from "../../hooks/useBuildActions";
import { useEnquiry } from "../Enquiry";
export function BuildSummary({
  onCategory,
  onGetBuild,
}: {
  onCategory: (category: ComponentCategory, compatible?: boolean) => void;
  onGetBuild?: () => void;
}) {
  const build = useBuilderStore();
  const parts = resolveParts(build.selectedComponents);
  const { issues, missing, complete } = validateBuild(parts);
  const power = estimatePower(parts);
  const total = calculateBuildTotal(build.selectedComponents);
  const actions = useBuildActions();
  const { openQuote } = useEnquiry();
  return (
    <section className={`build-summary${actions.manualCopy ? " has-manual-copy" : ""}`} aria-label="Your build summary">
      <div className="summary-heading">
        <div>
          <span className="eyebrow">YOUR BUILD</span>
          <h3>{build.buildId}</h3>
        </div>
        <span className="summary-counter">
          {Object.keys(parts).length} /{" "}
          {parts.cpu?.integratedGraphics && !parts.gpu ? 7 : 8}
        </span>
      </div>
      <p className="summary-context">
        {useCaseLabels[build.useCase]} <span>·</span> {build.resolution}
      </p>
      <div className="summary-details">
        <div className="summary-parts">
          {categories.map((category) => (
            <div className="summary-row" key={category}>
              <button onClick={() => onCategory(category)}>
                <small>{categoryLabels[category]}</small>
                <strong>
                  {parts[category]?.name ||
                    (category === "gpu" && parts.cpu?.integratedGraphics
                      ? "Integrated graphics"
                      : "Choose a component")}
                </strong>
              </button>
              {parts[category] && (
                <div>
                  <span>{money(parts[category]!.price)}</span>
                  <button
                    className="icon-button remove-part"
                    onClick={() => build.removeComponent(category)}
                    aria-label={`Remove ${categoryLabels[category]}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="summary-power">
          <div>
            <span>Estimated system power</span>
            <b>{power.estimatedPower}W</b>
          </div>
          <div>
            <span>Recommended PSU</span>
            <b>
              {power.recommendedPsuWattage
                ? `${power.recommendedPsuWattage}W+`
                : "—"}
            </b>
          </div>
          <small>Modeled CPU + GPU + 70W, with 25% headroom.</small>
        </div>
        <div className="summary-compatibility">
          {issues.length === 0 ? (
            <p className={complete ? "status-success" : "status-neutral"}>
              <Check size={15} />
              {complete
                ? "All selected components are compatible"
                : `${missing.length} more ${missing.length === 1 ? "part" : "parts"} to complete your build`}
            </p>
          ) : (
            issues.map((issue) => (
              <div
                className={`compatibility-notice ${issue.severity}`}
                key={issue.code}
              >
                <div>
                  <TriangleAlert size={15} />
                  <strong>{issue.title}</strong>
                </div>
                <p>{issue.message}</p>
                <button onClick={() => onCategory(issue.category, true)}>
                  View Compatible {categoryLabels[issue.category]}{" "}
                  <ChevronRight size={13} />
                </button>
              </div>
            ))
          )}
          <small>
            Checks cover modeled properties. BIOS, connectors and exact
            clearances need retailer review.
          </small>
        </div>
        <details className="suitability">
          <summary>Estimated workload suitability</summary>
          <div>
            {estimateSuitability(build.selectedComponents).map(
              ([label, value]) => (
                <p key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </p>
              ),
            )}
            <small>Heuristic guidance, not measured benchmarks.</small>
          </div>
        </details>
      </div>
      <div className="summary-footer">
        {issues.length > 0 ? (
          <button
            className="summary-footer-status warning-text"
            onClick={() => onCategory(issues[0].category, true)}
          >
            <TriangleAlert size={13} />
            {issues.length} compatibility{" "}
            {issues.length === 1 ? "notice" : "notices"} · review
          </button>
        ) : (
          <p
            className={`summary-footer-status ${complete ? "status-success" : "status-neutral"}`}
          >
            <Check size={13} />
            {complete
              ? "Compatibility checked"
              : `${missing.length} parts still to choose`}
          </p>
        )}
        <div className="summary-total">
          <span>ESTIMATED TOTAL</span>
          <strong aria-live="polite">{money(total)}</strong>
          <small>{productConfig.pricingDisclaimer} No peripherals or OS included.</small>
          {total > build.budget && (
            <p className="warning-text">
              {money(total - build.budget)} over your {money(build.budget)}{" "}
              budget
            </p>
          )}
        </div>
        <button
          className="button primary full"
          onClick={actions.copy}
        >
          <Copy size={17} /> Copy Build
        </button>
        <button className="button outline full" onClick={actions.share}>
          <Share2 size={17} /> Share Build
        </button>
        <button
          className="button text full"
          onClick={() => {
            onGetBuild?.();
            openQuote();
          }}
        >
          Request a Quote <ChevronRight size={17} />
        </button>
        <div className="summary-actions">
          <button onClick={actions.save}>
            <Save size={14} />
            Save
          </button>
        </div>
        {build.savedAt && (
          <p className="saved-label">
            Saved on this device ·{" "}
            {new Date(build.savedAt).toLocaleDateString("en-IN")}
          </p>
        )}
      </div>
      {actions.manualCopy && (
          <label className="manual-copy">
            Your browser cannot copy automatically. Select and copy below.
            <textarea
              autoFocus
              rows={8}
              readOnly
              value={actions.manualCopy}
              onFocus={(event) => event.target.select()}
            />
          </label>
      )}
    </section>
  );
}
