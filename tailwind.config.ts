import type { Config } from "tailwindcss";

/**
 * TendX design tokens (Build Spec section 4.1).
 * Colors are exposed via CSS variables defined in globals.css, so components
 * never hardcode hex values (Build Spec section 13).
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "rgb(var(--navy) / <alpha-value>)",
        navy2: "rgb(var(--navy2) / <alpha-value>)",
        navy3: "rgb(var(--navy3) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        teal: "rgb(var(--teal) / <alpha-value>)",
        teal2: "rgb(var(--teal2) / <alpha-value>)",
        mint: "rgb(var(--mint) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        gold2: "rgb(var(--gold2) / <alpha-value>)",
        slate: "rgb(var(--slate) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        bg: "rgb(var(--bg) / <alpha-value>)",
        cloud: "rgb(var(--cloud) / <alpha-value>)",
        white: "rgb(var(--white) / <alpha-value>)",
        green: "rgb(var(--green) / <alpha-value>)",
        red: "rgb(var(--red) / <alpha-value>)",
      },
      fontFamily: {
        // Sora for display/headings, IBM Plex Sans for body/UI (Build Spec section 4.2)
        display: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-ibm-plex-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        // Soft navy shadow at low opacity for cards (Build Spec section 4.4)
        card: "0 8px 24px -12px rgba(10, 37, 64, 0.18)",
      },
      backgroundImage: {
        "navy-hero":
          "linear-gradient(160deg, rgb(var(--navy)) 0%, rgb(var(--navy2)) 55%, rgb(var(--navy3)) 100%)",
        "teal-accent":
          "linear-gradient(90deg, rgb(var(--teal)), rgb(var(--teal2)))",
        "gold-accent":
          "linear-gradient(90deg, rgb(var(--gold)), rgb(var(--gold2)))",
      },
    },
  },
  plugins: [],
};
export default config;
