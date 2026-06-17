import type { Config } from 'tailwindcss';
// Workspace preset is a CommonJS file, so keep the import local and untyped for app builds.
// @ts-expect-error CJS workspace preset has no TypeScript declaration file.
import preset from '../../packages/config/tailwind/preset.cjs';

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
