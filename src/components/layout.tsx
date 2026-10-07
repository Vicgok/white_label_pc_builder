import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  MessageCircle,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { productConfig } from "../config/product";
import { Wordmark } from "./Wordmark";
import { useEnquiry } from "./Enquiry";
import { Dialog } from "./ui";
const nav = [
  ["/builder", "Build a PC"],
  ["/builder?view=3d", "3D Preview"],
  ["/builds", "Ready Builds"],
  ["/components", "Components"],
  ["/how-it-works", "How It Works"],
];

export function AppLayout() {
  const location = useLocation();
  const builder = location.pathname === "/builder";
  const { openHelp } = useEnquiry();
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => {
    setMobileMenu(false);
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    document.title = `${builder ? "Build a PC" : "Custom PCs"} | ${productConfig.name}`;
  }, [builder]);
  return (
    <div className={builder ? "builder-shell" : "marketing-shell"}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="marketing-header" data-theme={builder ? "dark" : "light"}>
        <div className="header-inner">
          <Wordmark />
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map(([path, label]) => {
              const active = !path.includes('?') && location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="header-actions">
            <button className="expert-link" onClick={openHelp}>
              Get Help <ArrowUpRight size={14} />
            </button>
            <Link
              className="button primary header-start"
              to="/builder"
              onClick={event => {
                if (!builder) return;
                event.preventDefault();
                const start = document.getElementById('builder-start');
                start?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
                start?.focus({ preventScroll: true });
              }}
            >
              Start Build <ArrowUpRight size={15} />
            </Link>
            <button
              className="icon-button mobile-menu-toggle"
              aria-label="Open navigation"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      {mobileMenu && (
        <Dialog dark={builder} title="Explore" onClose={() => setMobileMenu(false)}>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {nav.map(([path, label]) => (
              <Link
                key={path}
                to={path}
                aria-current={!path.includes('?') && location.pathname.startsWith(path) ? "page" : undefined}
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
              <span className="eyebrow">BUILD IT. CHECK IT. SEE IT.</span>
              <h2>See your next PC before it’s built.</h2>
              <p>Build around your budget. Check compatibility. Explore it in 3D.</p>
            </div>
            <div className="configuration-cta-actions">
            <Link className="button secondary" to="/builder">
              Build My PC <ArrowUpRight size={18} />
            </Link>
            <Link className="button text" to="/#3d-preview">Explore 3D Demo <ArrowRight size={17} /></Link>
            </div>
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
    </div>
  );
}
