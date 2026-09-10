import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gaffer: {
          pitch: '#00FF87', // Premier League neon green
          dark: '#0A0E17',  // Deep dark stadium navy
          surface: '#111827',
          card: '#161F30',
          border: '#22304A',
          gold: '#FFD700',
          red: '#FF4560',
          accent: '#38BDF8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
