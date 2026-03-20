/**
 * PM2 — chạy Next.js production (`next build` trước đó).
 *
 *   npm run build
 *   npx pm2 start ecosystem.config.cjs
 *
 * Biến DATABASE_URL, DEBT_APP_PASSWORD, … phải có trong môi trường:
 *   - export trước khi start, hoặc
 *   - dùng `env` / `env_production` bên dưới, hoặc
 *   - file .env.production (Next tự đọc khi start; PM2 không load .env mặc định).
 *
 * Logs: npx pm2 logs debt-done-right
 * Stop: npx pm2 stop debt-done-right
 */

const path = require("node:path");

const name = "debt-done-right";
const root = __dirname;

module.exports = {
  apps: [
    {
      name,
      cwd: root,
      script: path.join(root, "node_modules/next/dist/bin/next"),
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      // Bump khi cần scale trên một máy (fork + NODE_OPTIONS có thể cần tune)
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      merge_logs: true,
      time: true,
    },
  ],
};
