import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://forzatunes.com",
  output: "server",
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap({
      customPages: [
        "https://forzatunes.com/",
        "https://forzatunes.com/fh6",
        "https://forzatunes.com/fh6/tunes",
        "https://forzatunes.com/fh5",
        "https://forzatunes.com/fh5/tunes",
      ],
      filter: (page) =>
        !page.includes("/auth/") &&
        !page.includes("/profile") &&
        !page.includes("/banned") &&
        !page.includes("/og/") &&
        !page.includes("/fm"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
