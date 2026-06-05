import { describe, expect, it } from "vitest";
import { isAutoLoginRoute } from "./session";

describe("isAutoLoginRoute", () => {
  it("detects hash-router auto-login routes", () => {
    expect(isAutoLoginRoute("https://guesstheai.xyz/#/auto-login")).toBe(true);
    expect(isAutoLoginRoute("https://guesstheai.xyz/?jwt=abc#/auto-login")).toBe(true);
  });

  it("ignores non auto-login routes", () => {
    expect(isAutoLoginRoute("https://guesstheai.xyz/#/")).toBe(false);
    expect(isAutoLoginRoute("https://guesstheai.xyz/game")).toBe(false);
  });
});
