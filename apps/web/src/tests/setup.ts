import { beforeAll, afterEach, afterAll, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Enregistre explicitement les matchers jest-dom sur l'expect de CE vitest
// (l'auto-wiring /vitest ne cible pas la bonne instance avec vitest 4).
expect.extend(matchers);
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia (utilisé par next-themes et Radix)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver (utilisé par Radix Popover/Select)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock document.execCommand (utilisé par TipTap / ProseMirror)
document.execCommand = () => false;

// Mock IntersectionObserver (utilisé par embla-carousel / shadcn Carousel)
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};
