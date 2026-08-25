import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Agrinex Weather Station Dashboard',
        short_name: 'AgrinexWeather',
        description: 'Real-Time Weather Station & BMKG Comparison Dashboard',
        theme_color: '#e0e5ec'
      }
    })
  ],
});
