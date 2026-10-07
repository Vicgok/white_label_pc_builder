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
import { Link, Outlet, useLocation } from "react-router-dom";
import { productConfig } from "../config/product";
import { useBuildActions } from "../hooks/useBuildActions";
import { Wordmark } from "./Wordmark";
import { useEnquiry } from "./Enquiry";
import { Dialog } from "./ui";
const nav = [
  ["/builder", "Build a PC"],
  ["/builds", "Ready Builds"],
  ["/components", "Components"],
  ["/how-it-works", "How It Works"],
];

export function AppLayout() {
  const location = useLocation();
  const builder = location.pathname === "/builder";
  const { openHelp } = useEnquiry();
  const [mobileMenu, setMobileMenu] = useState(false);
  const actions = useBuildActions();
  useEffect(() => {
    setMobileMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    document.title = `${builder ? "Build a PC" : "Custom PCs"} | ${productConfig.name}`;
  }, [builder]);
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
                  aria-label="Share Build"
                  onClick={actions.share}
                >
                  <Share2 size={16} />
                  <span>Share Build</span>
                </button>
                <button
                  className="button outline"
                  aria-label="Get Help"
                  onClick={openHelp}
                >
                  <MessageCircle size={16} />
                  <span>Get Help</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <nav className="desktop-nav" aria-label="Main navigation">
                {nav.map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    className={
                      location.pathname.startsWith(path) ? "active" : ""
                    }
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="header-actions">
                <button className="expert-link" onClick={openHelp}>
                  Get Help <ArrowUpRight size={14} />
                </button>
                <Link
                  className="button primary header-start"
                  to="/builder"
                >
                  Start Build <ArrowUpRight size={15} />
                </Link>
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
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenu(false)}
              >
                {label}
                <ArrowRight size={20} />
              </Link>
            ))}
          </nav>
          <button
            className="button primary full"
            onClick={() => {
              setMobileMenu(false);
              openHelp();
            }}
          >
            Get Help
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
              <span className="eyebrow">YOUR BUILD. YOUR CHOICE.</span>
              <h2>Take your configuration anywhere.</h2>
              <p>Build a parts list to share with your preferred PC retailer.</p>
            </div>
            <Link className="button secondary" to="/builder">
              Start Build <ArrowUpRight size={18} />
            </Link>
          </section>
          <footer className="footer">
            <div className="page-width footer-main">
              <div>
                <Wordmark />
                <p>{productConfig.footer.line}</p>
              </div>
              <div className="footer-links">
                <Link to="/builder">Build a PC</Link>
                <Link to="/builds">Ready Builds</Link>
                <Link to="/how-it-works">How It Works</Link>
                <Link to="/for-retailers">For Retailers</Link>
              </div>
              <span className="footer-note">
                <small>{productConfig.footer.disclaimer}</small>
              </span>
            </div>
            <div className="page-width footer-bottom">
              <span>
                © {new Date().getFullYear()} {productConfig.name}
              </span>
              <span>{productConfig.tagline}</span>
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
