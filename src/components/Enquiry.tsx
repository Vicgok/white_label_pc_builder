import { createContext, useContext, useState, type ReactNode } from "react";
import { Copy, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { productConfig } from "../config/product";
import { useBuilderStore, snapshot } from "../store/builderStore";
import { resolveParts } from "../data/components";
import { calculateBuildTotal, money } from "../domain/pricing";
import { validateBuild } from "../domain/compatibility";
import { categoryLabels } from "../utils/catalog";
import { useBuildActions } from "../hooks/useBuildActions";
import type { BuildSnapshot } from "../types";
import { Dialog } from "./ui";

type EnquiryMode = { type: "quote"; build: BuildSnapshot } | { type: "help" } | null;
const EnquiryContext = createContext({
  openQuote: (_build?: BuildSnapshot) => {},
  openHelp: () => {},
});
export const useEnquiry = () => useContext(EnquiryContext);
export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EnquiryMode>(null);
  return (
    <EnquiryContext.Provider value={{
      openQuote: (build) => setMode({ type: "quote", build: build || snapshot(useBuilderStore.getState()) }),
      openHelp: () => setMode({ type: "help" }),
    }}>
      {children}
      {mode?.type === "quote" && <QuoteDialog build={mode.build} onClose={() => setMode(null)} />}
      {mode?.type === "help" && (
        <Dialog title="Find your starting point." onClose={() => setMode(null)}>
          <p className="dialog-intro">Choose your workload and budget. {productConfig.name} suggests a balanced starting point, then checks compatibility as you customize.</p>
          <div className="editorial-topics help-steps">
            {productConfig.howItWorks.map((step, index) => (
              <section key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></section>
            ))}
          </div>
          <p className="dialog-intro">For live pricing, availability or assembly advice, share your configuration with your preferred PC retailer.</p>
          <Link className="button primary full" to="/builder" onClick={() => setMode(null)}>Start Build</Link>
        </Dialog>
      )}
    </EnquiryContext.Provider>
  );
}
function QuoteDialog({ build, onClose }: { build: BuildSnapshot; onClose: () => void }) {
  const actions = useBuildActions(build);
  const parts = resolveParts(build.selectedComponents);
  const validation = validateBuild(parts);
  return (
    <Dialog title="Ready to price this build?" onClose={onClose}>
      <p className="dialog-intro">Copy or share your {productConfig.name} configuration with your preferred PC retailer to confirm live pricing, availability and assembly options.</p>
      <div className="quote-preview">
        <div><span className="eyebrow">{build.buildId}</span><strong>{money(calculateBuildTotal(build.selectedComponents))}</strong></div>
        <ul>{Object.entries(parts).map(([category, part]) => (
          <li key={category}><span>{categoryLabels[category as keyof typeof categoryLabels]}</span><b>{part.name}</b></li>
        ))}</ul>
        <small>{productConfig.pricingDisclaimer}</small>
        {(!validation.complete || validation.issues.length > 0) && (
          <p className="warning-text">This configuration needs review. {validation.missing.length > 0 && `${validation.missing.length} parts still need selection. `}{validation.issues.length > 0 && `${validation.issues.length} compatibility notices.`}</p>
        )}
      </div>
      <div className="quote-actions">
        <button className="button primary full" onClick={actions.copy}><Copy size={16} />Copy Build</button>
        <button className="button secondary full" onClick={actions.share}><Share2 size={16} />Copy Share Link</button>
      </div>
      {actions.manualCopy && (
        <label className="manual-copy">Your browser cannot copy automatically. Select and copy below.
          <textarea autoFocus readOnly rows={8} value={actions.manualCopy} onFocus={(event) => event.currentTarget.select()} />
        </label>
      )}
    </Dialog>
  );
}
