import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2F855A",
          secondary: "#E6F4EA",
          accent: "#F6C453",
          text: "#1F2937",
          background: "#F9FAFB",
        },
        market: {
          ink: "#1F2937",
          leaf: "#2F855A",
          mint: "#E6F4EA",
          coral: "#EF4444",
          cloud: "#F9FAFB",
          line: "#E5E7EB",
          steel: "#6B7280",
          amber: "#d97706",
          sea: "#2563eb",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 30px rgba(15, 23, 42, 0.04)",
        lift: "0 12px 32px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
