import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgriBridge — L'information pour tous, les opportunités pour chacun",
    short_name: "AgriBridge",
    description: "Financements, formations, experts, marketplace et communauté agricole au Sénégal.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f9f7",
    theme_color: "#18552f",
    lang: "fr",
    categories: ["business", "education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Trouver un financement", url: "/opportunites" },
      { name: "Mes candidatures", url: "/tableau-de-bord/candidatures" },
      { name: "AgriMarket", url: "/market" },
    ],
  };
}
