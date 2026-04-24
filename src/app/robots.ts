import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      disallow: [
        "/api/",
        "/settings",
        "/companies",
        "/es",
        "/interviews",
        "/deadlines",
        "/ob-visits",
        "/tests",
        "/offers",
        "/insights",
        "/onboarding",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: "https://careoai.jp/sitemap.xml",
  };
}
