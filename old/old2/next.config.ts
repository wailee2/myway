import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // React Compiler (stable in Next 16): automatic memoisation, no manual useMemo/useCallback needed.
  reactCompiler: true,
  poweredByHeader: false,
};

export default nextConfig;
