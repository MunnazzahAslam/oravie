import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Noor reads knowledge.md at runtime; make sure it ships with the chat route.
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledge.md"],
  },
};

export default nextConfig;
