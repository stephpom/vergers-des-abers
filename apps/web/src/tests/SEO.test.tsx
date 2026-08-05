import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SEO } from "@/components/SEO";

function renderSEO(props: React.ComponentProps<typeof SEO> = {}) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <SEO {...props} />
    </MemoryRouter>,
  );
}

describe("<SEO>", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://vergersdesabers.fr");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rend le titre avec suffixe " | Pom\'Pom"', async () => {
    renderSEO({ title: "Contact" });
    await waitFor(() => {
      expect(document.title).toContain("Contact | Pom'Pom");
    });
  });

  it("rend la description par défaut si non fournie", async () => {
    renderSEO();
    await waitFor(() => {
      const meta = document.querySelector('meta[name="description"]');
      expect(meta).not.toBeNull();
      expect(meta?.getAttribute("content")).toContain("Vergers des Abers");
    });
  });

  it("rend canonical, og:url et og:image en URLs absolues", async () => {
    renderSEO({ image: "/og-image.jpg" });
    await waitFor(() => {
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute("href")).toMatch(/^https:\/\/pompom\.fr/);

      const ogUrl = document.querySelector('meta[property="og:url"]');
      expect(ogUrl?.getAttribute("content")).toMatch(/^https:\/\/pompom\.fr/);

      const ogImage = document.querySelector('meta[property="og:image"]');
      expect(ogImage?.getAttribute("content")).toMatch(/^https:\/\/pompom\.fr/);
    });
  });

  it("rend noindex si prop noindex=true", async () => {
    renderSEO({ noindex: true });
    await waitFor(() => {
      const robots = document.querySelector('meta[name="robots"]');
      expect(robots).not.toBeNull();
      expect(robots?.getAttribute("content")).toContain("noindex");
    });
  });

  it("accepte des children (JSON-LD) qui se retrouvent dans le head", async () => {
    const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "Organization" });
    renderSEO({
      children: <script type="application/ld+json">{jsonLd}</script>,
    });
    await waitFor(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThan(0);
    });
  });
});
