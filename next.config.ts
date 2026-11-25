import type { NextConfig } from "next";

// Toutes les pages de RonyIA dépendent de la session utilisateur (cookies Supabase) :
// on reste sur le rendu dynamique classique, sans Cache Components.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
