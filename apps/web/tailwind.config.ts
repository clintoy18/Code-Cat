import type { Config } from 'tailwindcss';
import preset from '@codecat/config/tailwind';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [preset],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
    },
  },
} satisfies Config;
