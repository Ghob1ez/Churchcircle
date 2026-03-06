import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Create a define object for all VITE_ variables
  const processEnvValues = Object.entries(env)
    .filter(([key]) => key.startsWith('VITE_') || key === 'GEMINI_API_KEY')
    .reduce((prev, [key, val]) => {
      return {
        ...prev,
        [`process.env.${key}`]: JSON.stringify(val),
        [`import.meta.env.${key}`]: JSON.stringify(val),
      };
    }, {});

  return {
    plugins: [react(), tailwindcss()],
    define: {
      ...processEnvValues,
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
