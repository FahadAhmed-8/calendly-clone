import type { Config } from "tailwindcss";

// Design tokens copied directly from the Stitch "Architectural Chronos" design.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0054cc",
        "primary-container": "#006bff",
        "primary-fixed": "#dae2ff",
        "primary-fixed-dim": "#b1c5ff",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#001847",
        "on-primary-fixed-variant": "#0040a0",
        "on-primary-container": "#fffcff",

        secondary: "#415c9d",
        "secondary-container": "#9db7ff",
        "secondary-fixed": "#dae2ff",
        "secondary-fixed-dim": "#b1c5ff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#2a4686",
        "on-secondary-fixed": "#001847",
        "on-secondary-fixed-variant": "#284484",

        tertiary: "#a53800",
        "tertiary-container": "#ce4800",
        "tertiary-fixed": "#ffdbce",
        "tertiary-fixed-dim": "#ffb59a",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#fffdff",
        "on-tertiary-fixed": "#380d00",
        "on-tertiary-fixed-variant": "#802a00",

        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        background: "#f8f9ff",
        "on-background": "#001c37",
        surface: "#f8f9ff",
        "on-surface": "#001c37",
        "on-surface-variant": "#424655",
        "surface-bright": "#f8f9ff",
        "surface-dim": "#c4dcff",
        "surface-variant": "#d2e4ff",
        "surface-tint": "#0056d0",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d2e4ff",

        outline: "#727787",
        "outline-variant": "#c2c6d8",
        "inverse-surface": "#19324d",
        "inverse-on-surface": "#eaf1ff",
        "inverse-primary": "#b1c5ff",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "elev-1": "0 1px 2px rgba(10, 37, 64, 0.06)",
        "elev-2": "0px 12px 32px -4px rgba(10, 37, 64, 0.08)",
        "elev-3": "0 12px 32px rgba(10, 37, 64, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
