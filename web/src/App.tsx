import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Rail from "./components/Rail";
import Footer from "./components/Footer";
import DocsLayout from "./components/DocsLayout";
import CommandPalette from "./components/CommandPalette";
import { useSpotlight } from "./lib/hooks";
import Home from "./pages/Home";
import About from "./pages/About";
import Explore from "./pages/Explore";
import Product from "./pages/Product";
import OpenSource from "./pages/OpenSource";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    // `scroll-behavior: smooth` on <html> would turn every route change into a
    // slow animated flight to the top — jump instead, the animation belongs to
    // in-page anchors.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [pathname]);
  return null;
}

export default function App() {
  useSpotlight();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollManager />
      <CommandPalette />
      <Rail />
      <main className="main" id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/product" element={<Product />} />
          <Route path="/opensource" element={<OpenSource />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/docs" element={<DocsLayout />} />
          <Route path="/docs/:slug" element={<DocsLayout />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/shorten" element={<Navigate to="/product" replace state={{ shorten: true }} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}