import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is fully client-side (all data access uses the Firebase SDK), so it
  // is exported as static HTML and served from the Firebase Hosting CDN.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
