import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.wallzy.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wallzy.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn-us.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn-eu.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.byteimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ibyteimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.pstatp.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/contact", destination: "/contact.html" },
      { source: "/privacy", destination: "/privacy.html" },
      { source: "/terms", destination: "/terms.html" },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
