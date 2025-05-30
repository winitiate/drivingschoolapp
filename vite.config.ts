// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
  // Load .env*, including .env.local
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const apiBase = process.env.VITE_API_BASE;
  if (!apiBase) {
    console.warn(
      "VITE_API_BASE is missing. You’ll need it to proxy /api to your functions emulator."
    );
  }

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        // Forward anything under /api/payments to your Functions emulator
        "/api/payments": {
          target: apiBase,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/payments/, "/createPayment"),
        },
      },
    },
  });
};
