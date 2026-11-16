import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Gera um servidor autocontido em .next/standalone, usado pela imagem Docker.
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/calendario",
        destination: "/agenda",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
