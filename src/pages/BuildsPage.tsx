import { useState } from "react";
import { readyBuilds } from "../data/builds";
import { resolveParts } from "../data/components";
import { calculateBuildTotal } from "../domain/pricing";
import { useCases, useCaseLabels } from "../utils/catalog";
import { BuildCard } from "../components/BuildCard";
import { EmptyState } from "../components/ui";
import { productConfig } from "../config/product";
export function BuildsPage() {
  const [useCase, setUseCase] = useState("all");
  const [budget, setBudget] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [gpu, setGpu] = useState("all");
  const [resolution, setResolution] = useState("all");
  const builds = readyBuilds.filter((build) => {
    const parts = resolveParts(build.components);
    return (
      (useCase === "all" || build.useCases.some((u) => u === useCase)) &&
      (budget === "all" ||
        calculateBuildTotal(build.components) <= Number(budget)) &&
      (platform === "all" || parts.cpu?.brand === platform) &&
      (gpu === "all" ||
        (gpu === "entry"
          ? (parts.gpu?.performanceTier || 0) <= 4
          : gpu === "performance"
            ? parts.gpu?.performanceTier === 6
            : (parts.gpu?.performanceTier || 0) >= 7)) &&
      (resolution === "all" || build.resolution === resolution)
    );
  });
  return (
    <div className="page-width listing-page">
      <div className="page-intro">
        <span className="eyebrow">A HEAD START, WITHOUT THE GUESSWORK</span>
        <h1>
          Ready-to-go PCs.
          <br />
          <span>Balanced from the start.</span>
        </h1>
        <p>
          Thoughtful configurations for different ambitions. Pick a foundation,
          then make it yours.
        </p>
      </div>
      <div className="listing-filters">
        <label>
          Use case
          <select
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
          >
            <option value="all">All workloads</option>
            {useCases.map((useCase) => (
              <option value={useCase} key={useCase}>
                {useCaseLabels[useCase]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Budget
          <select
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
          >
            <option value="all">All budgets</option>
            <option value="100000">Under ₹1L</option>
            <option value="150000">Under ₹1.5L</option>
            <option value="250000">Under ₹2.5L</option>
            <option value="400000">Under ₹4L</option>
          </select>
        </label>
        <label>
          CPU platform
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          >
            <option value="all">All platforms</option>
            <option>AMD</option>
            <option>Intel</option>
          </select>
        </label>
        <label>
          GPU class
          <select value={gpu} onChange={(event) => setGpu(event.target.value)}>
            <option value="all">All classes</option>
            <option value="entry">Starter</option>
            <option value="performance">Performance</option>
            <option value="creator">Creator / Workstation</option>
          </select>
        </label>
        <label>
          Resolution
          <select
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
          >
            <option value="all">Any resolution</option>
            <option>1080p</option>
            <option>1440p</option>
            <option>4K</option>
          </select>
        </label>
      </div>
      <div className="listing-result-count">
        {builds.length} configurations{" "}
        <span>{productConfig.pricingDisclaimer}</span>
      </div>
      <div className="build-grid ready-build-grid">
        {builds.map((build) => (
          <BuildCard key={build.slug} build={build} />
        ))}
      </div>
      {!builds.length && (
        <EmptyState
          title="No builds match those filters."
          description="Every configuration can be customized. Try a wider starting point."
        >
          <button
            className="button secondary"
            onClick={() => {
              setUseCase("all");
              setBudget("all");
              setPlatform("all");
              setGpu("all");
              setResolution("all");
            }}
          >
            Clear filters
          </button>
        </EmptyState>
      )}
    </div>
  );
}
