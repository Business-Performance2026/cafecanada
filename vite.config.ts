import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ⚠️ مهم: غيّر "cafe-qr" إلى اسم مستودعك على GitHub بالضبط
  // مثال: لو رابط مستودعك github.com/ahmed/my-coffee  ← حط "/my-coffee/"
  base: "/cafecanada/",

  server: { port: 3000 },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: { outDir: "dist" },
});
