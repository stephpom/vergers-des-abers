/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
// Ponte les matchers @testing-library/jest-dom sur les types de vitest 4.
// Vitest 4 expose le point d'extension `Matchers<T>` (dont `Assertion` hérite) ;
// jest-dom 6.9.1 n'augmente encore que l'ancienne `Assertion`, d'où ce shim.
// (Le runtime est branché par `@testing-library/jest-dom/vitest` dans setup.ts.)
import "vitest";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  interface Matchers<T = any> extends TestingLibraryMatchers<any, T> {}
}
