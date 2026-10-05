import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import icon from 'astro-icon';

export default defineConfig({
  integrations: [
    react(),
    icon({
      include: {
        'simple-icons': ['instagram', 'youtube', 'linkedin', 'github'],
      },
    }),
  ],
  output: 'static',
});