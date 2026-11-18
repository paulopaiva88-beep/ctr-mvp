import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pine: "var(--pine)",
        moss: "var(--moss)",
        fern: "var(--fern)",
        trail: "var(--trail)",
        soil: "var(--soil)",
        sand: "var(--sand)",
        fog: "var(--fog)",
        mist: "var(--mist)",
        amber: "var(--amber)",
        clay: "var(--clay)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        ok: "var(--ok)",
        warn: "var(--warn)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 40px rgba(20, 32, 26, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
