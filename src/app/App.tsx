import { Component, useEffect, type ReactNode } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { BrandContext, resolveBrand } from "../config/brand";
import { ToastProvider } from "../components/ui";
import { EnquiryProvider } from "../components/Enquiry";
import { AppLayout } from "../components/layout";
import { HomePage } from "../pages/HomePage";
import { BuilderPage } from "../pages/BuilderPage";
import { BuildsPage } from "../pages/BuildsPage";
import { BuildDetailPage } from "../pages/BuildDetailPage";
import { ComponentsPage } from "../pages/ComponentsPage";
import {
  DemoPage,
  NotFoundPage,
  SupportPage,
  WhyUsPage,
} from "../pages/InfoPages";
function BrandedApp() {
  const location = useLocation();
  const { brand, missing } = resolveBrand(location.search);
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", brand.theme.primary);
    root.style.setProperty("--brand-primary-hover", brand.theme.primaryHover);
    root.style.setProperty("--brand-primary-soft", brand.theme.primarySoft);
  }, [brand]);
  return (
    <BrandContext.Provider value={brand}>
      <ToastProvider>
        <EnquiryProvider>
          {missing && (
            <div className="brand-fallback" role="status">
              Brand “{missing}” is not configured. Showing {brand.name}.
            </div>
          )}
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="builder" element={<BuilderPage />} />
              <Route path="builds" element={<BuildsPage />} />
              <Route path="builds/:slug" element={<BuildDetailPage />} />
              <Route path="components" element={<ComponentsPage />} />
              <Route path="why-us" element={<WhyUsPage />} />
              <Route path="support" element={<SupportPage />} />
              {import.meta.env.DEV && (
                <Route path="demo" element={<DemoPage />} />
              )}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </EnquiryProvider>
      </ToastProvider>
    </BrandContext.Provider>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="page-width not-found">
        <h1>Something interrupted this preview.</h1>
        <p>Reload to try again. Your saved build stays on this device.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload preview
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <BrandedApp />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
