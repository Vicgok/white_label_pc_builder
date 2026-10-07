import { Component, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { productConfig } from "../config/product";
import { ToastProvider } from "../components/ui";
import { EnquiryProvider } from "../components/Enquiry";
import { AppLayout } from "../components/layout";
import { HomePage } from "../pages/HomePage";
import { BuilderPage } from "../pages/BuilderPage";
import { BuildsPage } from "../pages/BuildsPage";
import { BuildDetailPage } from "../pages/BuildDetailPage";
import { ComponentsPage } from "../pages/ComponentsPage";
import {
  ForRetailersPage,
  NotFoundPage,
  SupportPage,
  HowItWorksPage,
} from "../pages/InfoPages";
function ProductApp() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", productConfig.theme.primary);
    root.style.setProperty("--brand-primary-hover", productConfig.theme.primaryHover);
    root.style.setProperty("--brand-primary-soft", productConfig.theme.primarySoft);
  }, []);
  return (
    <ToastProvider>
      <EnquiryProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="builder" element={<BuilderPage />} />
            <Route path="builds" element={<BuildsPage />} />
            <Route path="builds/:slug" element={<BuildDetailPage />} />
            <Route path="components" element={<ComponentsPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="why-us" element={<Navigate to="/how-it-works" replace />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="for-retailers" element={<ForRetailersPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </EnquiryProvider>
    </ToastProvider>
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
        <ProductApp />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
