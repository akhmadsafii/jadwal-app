import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Apotika",
    short_name: "Apotika",
    description: "Aplikasi pengajuan dan pengelolaan jadwal shift kerja",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#FAF8FF",
    theme_color: "#004AC6",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/apotika-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apotika-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
