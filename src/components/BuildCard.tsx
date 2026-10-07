import { ArrowUpRight } from "lucide-react";
import { resolveParts } from "../data/components";
import { calculateBuildTotal, money } from "../domain/pricing";
import type { ReadyBuild } from "../types";
import { Link } from "react-router-dom";
import { PcVisual } from "./HardwareVisual";
export function BuildCard({ build }: { build: ReadyBuild }) {
  const parts = resolveParts(build.components);
  return (
    <article className="build-card">
      <Link
        to={`/builds/${build.slug}`}
        className="build-card-visual"
        aria-label={`View ${build.name}`}
      >
        <span className="eyebrow">{build.class}</span>
        <PcVisual />
        <span className="resolution-tag">{build.resolution} READY</span>
      </Link>
      <div className="build-card-body">
        <h3>
          <Link to={`/builds/${build.slug}`}>{build.name}</Link>
        </h3>
        <p>{build.description}</p>
        <div className="build-card-specs">
          <span>{parts.cpu?.name}</span>
          <span>{parts.gpu?.name.replace("GeForce ", "")}</span>
          <span>
            {parts.memory?.capacityGb}GB {parts.memory?.memoryType} ·{" "}
            {(parts.storage?.capacityGb || 0) / 1000}TB NVMe
          </span>
        </div>
        <div className="build-card-bottom">
          <strong>{money(calculateBuildTotal(build.components))}</strong>
          <Link
            className="button text"
            to={`/builder?build=${build.slug}`}
          >
            Customize <ArrowUpRight size={16} />
          </Link>
        </div>
        <Link className="view-build-link" to={`/builds/${build.slug}`}>
          View Build <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}
