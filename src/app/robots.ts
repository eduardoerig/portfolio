import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// O painel não tem nada para indexar.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
