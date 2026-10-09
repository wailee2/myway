import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // React Compiler (stable in Next 16): automatic memoisation, no manual useMemo/useCallback needed.
  reactCompiler: true,
  poweredByHeader: false,
  // The browser talks to same-origin /api/*; Next forwards it to FastAPI. No CORS, no hard-coded host in client code.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
