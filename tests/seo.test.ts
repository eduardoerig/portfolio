// @vitest-environment node
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("SEO", () => {
  it("sitemap lista as duas versões, apontando uma para a outra", () => {
    const urls = sitemap();
    expect(urls.map((u) => new URL(u.url).pathname)).toEqual(["/", "/en"]);
    expect(urls[0].alternates?.languages?.en).toMatch(/\/en$/);
  });

  it("robots libera o site, esconde o painel e indica o sitemap", () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toContain("/admin");
    expect(String(r.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});
