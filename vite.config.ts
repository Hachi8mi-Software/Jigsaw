import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { copyFileSync, existsSync } from "fs";

const host = process.env.TAURI_DEV_HOST;

// 应用配置常量 - 支持环境变量控制
const BASE_URL = process.env.VITE_BASE_URL || "/";

// GitHub Pages SPA 支持插件
const githubPagesPlugin = () => {
  return {
    name: 'github-pages-spa',
    writeBundle() {
      // 在构建完成后，复制 index.html 为 404.html
      const indexPath = resolve(__dirname, 'dist/index.html');
      const notFoundPath = resolve(__dirname, 'dist/404.html');
      
      if (existsSync(indexPath)) {
        copyFileSync(indexPath, notFoundPath);
        console.log('✓ 已生成 404.html 文件用于 GitHub Pages SPA 支持');
      }
    }
  };
};

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue(), githubPagesPlugin()],
  
  base: BASE_URL,
  
  define: {
    __BASE_URL__: JSON.stringify(BASE_URL),
  },
  
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 5174,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
