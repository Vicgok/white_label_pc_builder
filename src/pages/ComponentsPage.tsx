import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { components } from "../data/components";
import { categories, type ComponentCategory } from "../types";
import { categoryLabels, componentSpecs } from "../utils/catalog";
import { money } from "../domain/pricing";
import { BrandLink } from "../components/BrandLink";
import { PartVisual } from "../components/HardwareVisual";
import { EmptyState } from "../components/ui";
export function ComponentsPage() {
  const [category, setCategory] = useState<ComponentCategory>("cpu");
  const [search, setSearch] = useState("");
  const filtered = components.filter(
    (part) =>
      part.category === category &&
      `${part.brand} ${part.name} ${componentSpecs(part)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="page-width listing-page">
      <div className="page-intro">
        <span className="eyebrow">KNOW YOUR BUILDING BLOCKS</span>
        <h1>
          Great parts.
          <br />
          <span>Better together.</span>
        </h1>
        <p>
          Explore the sample catalog. Bring your choices into the builder to
          check how they fit.
        </p>
      </div>
      <div className="component-catalog-tabs" aria-label="Catalog categories">
        {categories.map((item) => (
          <button
            key={item}
            aria-pressed={item === category}
            className={item === category ? "active" : ""}
            onClick={() => {
              setCategory(item);
              setSearch("");
            }}
          >
            {categoryLabels[item]}
          </button>
        ))}
      </div>
      <label className="search-input catalog-search">
        <Search size={18} />
        <span className="sr-only">Search catalog</span>
        <input
          placeholder="Search the catalog…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="catalog-grid">
        {filtered.map((part) => (
          <article className="catalog-card" key={part.id}>
            <PartVisual component={part} />
            <small>{part.brand}</small>
            <h3>{part.name}</h3>
            <p>{componentSpecs(part)}</p>
            <div>
              <strong>{money(part.price)}</strong>
              <BrandLink
                className="button text"
                to={`/builder?category=${category}`}
              >
                Explore in builder <ArrowUpRight size={15} />
              </BrandLink>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          title="No matching parts."
          description="Try a shorter name or a different category."
        >
          <button className="button secondary" onClick={() => setSearch("")}>
            Clear search
          </button>
        </EmptyState>
      )}
      <p className="catalog-note">
        Sample data · illustrative prices and specifications, with no live stock
        checking.
      </p>
    </div>
  );
}
