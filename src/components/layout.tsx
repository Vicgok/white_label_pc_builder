import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Copy,
  Menu,
  MessageCircle,
  Save,
  Share2,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { useBrand } from "../config/brand";
import { useBuildActions } from "../hooks/useBuildActions";
import { BrandLink, Wordmark } from "./BrandLink";
import { useEnquiry } from "./Enquiry";
import { Dialog } from "./ui";
const nav = [
  ["/builder", "Build a PC"],
  ["/builds", "Ready Builds"],
  ["/components", "Components"],
  ["/why-us", "Why Us"],
  ["/support", "Support"],
];

export function AppLayout() {
  const location = useLocation();
  const brand = useBrand();
  const builder = location.pathname === "/builder";
  const { openHelp, openConfiguration } = useEnquiry();
  const [mobileMenu, setMobileMenu] = useState(false);
  const actions = useBuildActions();
  useEffect(() => {
    setMobileMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    document.title = `${builder ? "Build a PC" : "Custom PCs"} | ${brand.name}`;
  }, [brand.name, builder]);
  return (
    <div className={builder ? "builder-shell" : "marketing-shell"}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className={builder ? "app-header" : "marketing-header"}>
        <div className="header-inner">
          <Wordmark />
          {builder ? (
            <>
              <span className="app-title">
                PC CONFIGURATOR <span>/</span> Build a PC
              </span>
              <div className="header-actions">
                <button
                  className="button text"
                  aria-label="Save"
                  onClick={actions.save}
                >
                  <Save size={16} />
                  <span>Save</span>
                </button>
                <button
                  className="button text"
                  aria-label="Share"
                  onClick={actions.share}
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
                <button
                  className="button outline"
                  aria-label="Expert Help"
                  onClick={openHelp}
                >
                  <MessageCircle size={16} />
                  <span>Expert Help</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <nav className="desktop-nav" aria-label="Main navigation">
                {nav.map(([path, label]) => (
                  <BrandLink
                    key={path}
                    to={path}
                    className={
                      location.pathname.startsWith(path) ? "active" : ""
                    }
                  >
                    {label}
                  </BrandLink>
                ))}
              </nav>
              <div className="header-actions">
                <button className="expert-link" onClick={openHelp}>
                  Talk to an Expert <ArrowUpRight size={14} />
                </button>
                <BrandLink
                  className="button primary header-start"
                  to="/builder"
                >
                  Start Build <ArrowUpRight size={15} />
                </BrandLink>
                <button
                  className="icon-button mobile-menu-toggle"
                  aria-label="Open navigation"
                  onClick={() => setMobileMenu(true)}
                >
                  <Menu size={22} />
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      {mobileMenu && (
        <Dialog title="Explore" onClose={() => setMobileMenu(false)}>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {nav.map(([path, label]) => (
              <BrandLink
                key={path}
                to={path}
                onClick={() => setMobileMenu(false)}
              >
                {label}
                <ArrowRight size={20} />
              </BrandLink>
            ))}
          </nav>
          <button
            className="button primary full"
            onClick={() => {
              setMobileMenu(false);
              openHelp();
            }}
          >
            Talk to an Expert
          </button>
        </Dialog>
      )}
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      {!builder && (
        <>
          <section className="configuration-cta page-width">
            <div>
              <span className="eyebrow">GOT A PARTS LIST?</span>
              <h2>Already have a configuration?</h2>
              <p>Turn your wishlist into a clear quotation.</p>
            </div>
            <button className="button secondary" onClick={openConfiguration}>
              Get a quote <ArrowUpRight size={18} />
            </button>
          </section>
          <footer className="footer">
            <div className="page-width footer-main">
              <div>
                <Wordmark />
                <p>{brand.tagline}</p>
              </div>
              <div className="footer-links">
                <BrandLink to="/builder">Build a PC</BrandLink>
                <BrandLink to="/builds">Ready Builds</BrandLink>
                <BrandLink to="/support">Support</BrandLink>
              </div>
              <span className="footer-note">
                A custom PC, built around you.
                <br />
                <small>Retailer preview · sample prices & configurations</small>
              </span>
            </div>
            <div className="page-width footer-bottom">
              <span>
                © {new Date().getFullYear()} {brand.name}
              </span>
              <span>Every great build starts with a conversation.</span>
            </div>
          </footer>
        </>
      )}
      <button
        className="floating-help"
        onClick={openHelp}
        aria-label="Need help choosing?"
      >
        <MessageCircle size={19} />
        <span>Need help choosing?</span>
      </button>
      {actions.manualCopy && (
        <Dialog
          title="Copy your build"
          onClose={() => actions.setManualCopy(null)}
        >
          <p>
            Your browser cannot copy automatically. Select and copy the text
            below.
          </p>
          <label>
            Build text or link
            <textarea
              readOnly
              rows={8}
              value={actions.manualCopy}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
          <button
            className="button secondary"
            onClick={() => actions.setManualCopy(null)}
          >
            <Copy size={16} />
            Done
          </button>
        </Dialog>
      )}
    </div>
  );
}
