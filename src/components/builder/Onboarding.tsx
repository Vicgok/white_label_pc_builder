import { useState } from "react";
import {
  ArrowRight,
  Check,
  RotateCcw,
  SlidersHorizontal,
  WandSparkles,
} from "lucide-react";
import { useBuilderStore } from "../../store/builderStore";
import { recommendBuild } from "../../domain/recommendation";
import { isBuildSnapshot } from "../../domain/build-serialization";
import { money } from "../../domain/pricing";
import {
  useCases,
  useCaseLabels,
  useCaseDescriptions,
} from "../../utils/catalog";
import { useCaseIcons } from "../../pages/HomePage";
import type { Resolution } from "../../types";
import { useToast } from "../ui";
export function Onboarding({
  onDone,
}: {
  onDone: (explanation?: string) => void;
}) {
  const build = useBuilderStore();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [minimum, setMinimum] = useState<number | null>(null);
  const [saved] = useState(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("pc-builder-saved") || "null",
      );
      return isBuildSnapshot(value) ? value : null;
    } catch {
      return null;
    }
  });
  const recommend = () => {
    const result = recommendBuild({
      budget: build.budget,
      useCase: build.useCase,
      resolution: build.resolution,
    });
    if (result.status === "budget-too-low") {
      setError(result.message);
      setMinimum(result.minimumBudget);
      return;
    }
    useBuilderStore.setState({
      selectedComponents: result.selectedComponents,
      started: true,
      savedAt: null,
    });
    onDone(result.explanation);
    toast("Your balanced starting build is ready.");
  };
  return (
    <div className="onboarding">
      <div className="onboarding-title">
        <span className="eyebrow">A LITTLE ABOUT YOU. A BETTER PC.</span>
        <h1>Find your starting point.</h1>
        <p>
          Two choices. One balanced configuration. Every part is yours to
          change.
        </p>
      </div>
      <section>
        <div className="step-heading">
          <span>01</span>
          <h2>What will you use your PC for?</h2>
        </div>
        <div className="onboarding-use-cases">
          {useCases.map((useCase) => {
            const Icon = useCaseIcons[useCase];
            return (
              <button
                key={useCase}
                aria-pressed={build.useCase === useCase}
                className={build.useCase === useCase ? "selected" : ""}
                onClick={() => {
                  build.setUseCase(useCase);
                  setError("");
                }}
              >
                <Icon size={23} strokeWidth={1.5} />
                <strong>{useCaseLabels[useCase]}</strong>
                <small>{useCaseDescriptions[useCase]}</small>
                {build.useCase === useCase && (
                  <Check size={16} className="choice-check" />
                )}
              </button>
            );
          })}
        </div>
      </section>
      <section className="budget-step">
        <div className="step-heading">
          <span>02</span>
          <h2>What’s your budget?</h2>
          <strong>{money(build.budget)}</strong>
        </div>
        <label className="range-label" htmlFor="budget-slider">
          PC tower budget · excluding monitor and peripherals
        </label>
        <input
          id="budget-slider"
          type="range"
          min="20000"
          max="400000"
          step="1000"
          value={Math.min(build.budget, 400000)}
          onChange={(event) => {
            build.setBudget(Number(event.target.value));
            setError("");
          }}
        />
        <div className="range-endpoints">
          <span>₹20,000</span>
          <span>₹4,00,000</span>
        </div>
        <div className="budget-presets">
          {[50000, 75000, 100000, 125000, 150000, 200000, 300000].map(
            (budget) => (
              <button
                key={budget}
                aria-pressed={build.budget === budget}
                className={build.budget === budget ? "selected" : ""}
                onClick={() => {
                  build.setBudget(budget);
                  setError("");
                }}
              >
                {money(budget)}
              </button>
            ),
          )}
        </div>
        {["gaming", "streaming"].includes(build.useCase) && (
          <div className="resolution-selector">
            <span>Your target resolution</span>
            {(["1080p", "1440p", "4K"] as Resolution[]).map((resolution) => (
              <button
                key={resolution}
                aria-pressed={build.resolution === resolution}
                onClick={() => build.setResolution(resolution)}
                className={build.resolution === resolution ? "selected" : ""}
              >
                {resolution}
              </button>
            ))}
          </div>
        )}
      </section>
      {error && (
        <div className="budget-error" role="alert">
          <h3>A little more room would help.</h3>
          <p>{error}</p>
          {minimum && (
            <button
              className="button outline"
              onClick={() => {
                build.setBudget(Math.ceil(minimum / 1000) * 1000);
                setError("");
              }}
            >
              Set budget to {money(Math.ceil(minimum / 1000) * 1000)}
            </button>
          )}
        </div>
      )}
      <div className="onboarding-actions">
        <button className="button primary" onClick={recommend}>
          <WandSparkles size={18} />
          Build it for me <ArrowRight size={17} />
        </button>
        <button
          className="button outline"
          onClick={() => {
            build.startBuild();
            onDone();
          }}
        >
          <SlidersHorizontal size={16} />
          I’ll choose the parts
        </button>
      </div>
      <p className="onboarding-note">
        Rule-based recommendations. Sample prices. No mystery AI.
      </p>
      {saved && (
        <button
          className="restore-build"
          onClick={() => {
            build.loadBuild(saved);
            onDone();
            toast(`Restored ${saved.buildId}.`);
          }}
        >
          <RotateCcw size={15} />
          Restore saved build {saved.buildId}
        </button>
      )}
    </div>
  );
}
