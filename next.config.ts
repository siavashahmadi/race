import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" bundles the server + node_modules into .next/standalone
  // so the Docker image doesn't need the full node_modules folder.
  // Cuts image size significantly.
  output: "standalone",
};

export default nextConfig;
