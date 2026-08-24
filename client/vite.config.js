import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  // ⚠️ 這是最核心、必備的關鍵修改，確保資產能在 Render 伺服器上正確讀取
  base: "./",
});
