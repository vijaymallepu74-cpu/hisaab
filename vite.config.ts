import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function getPublicXlsxTemplate() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.xlsx'));
    if (files.length > 0) {
      return files[0];
    }
  }
  return 'My_Shop_hisaab_ledger_2026-11-19.xlsx';
}

// Auto-sync manifest on vite startup
try {
  const tpl = getPublicXlsxTemplate();
  const manifestPath = path.resolve(process.cwd(), 'public', 'template-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ template: tpl }, null, 2));
} catch (e) {
  console.warn('Failed to sync template-manifest.json:', e);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'detect-excel-template',
      configureServer(server) {
        server.middlewares.use('/api/get-template', (_req, res) => {
          const tpl = getPublicXlsxTemplate();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ template: tpl }));
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
});
