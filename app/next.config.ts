import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // V2 became the home page on 3 Oct 2026. Old links (including shared
  // searches, whose query string passes through) still land on it.
  async redirects() {
    return [{ source: "/v2", destination: "/", permanent: false }];
  },
};

export default nextConfig;
