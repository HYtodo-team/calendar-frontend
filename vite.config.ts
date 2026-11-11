import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      proxy: mode === 'backend' ? {
        '/api/v1': {
          target: env.BACKEND_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      } : undefined,
    },
  };
});
