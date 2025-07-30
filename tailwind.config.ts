import type { Config } from "tailwindcss"
import defaultConfig from "shadcn/ui/tailwind.config"

const config: Config = {
  ...defaultConfig,
  content: [
    ...defaultConfig.content,
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    ...defaultConfig.theme,
    extend: {
      ...defaultConfig.theme.extend,
      colors: {
        ...defaultConfig.theme.extend.colors,
        card: {
          ...defaultConfig.theme.extend.colors.card,
          DEFAULT: "#FFFFFF",
          foreground: "#4D475B",
        },
        popover: {
          ...defaultConfig.theme.extend.colors.popover,
          DEFAULT: "#FFFFFF",
          foreground: "#4D475B",
        },
        primary: {
          ...defaultConfig.theme.extend.colors.primary,
          DEFAULT: "#833ADF",
          foreground: "#FFFFFF",
        },
        secondary: {
          ...defaultConfig.theme.extend.colors.secondary,
          DEFAULT: "#D9D8FD",
          foreground: "#4D475B",
        },
        muted: {
          ...defaultConfig.theme.extend.colors.muted,
          DEFAULT: "#D9D8FD",
          foreground: "#94909C",
        },
        accent: {
          ...defaultConfig.theme.extend.colors.accent,
          DEFAULT: "#D9D8FD",
          foreground: "#4D475B",
        },
        destructive: {
          ...defaultConfig.theme.extend.colors.destructive,
          DEFAULT: "#F22C7C",
          foreground: "#FFFFFF",
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#4D475B",
          primary: "#833ADF",
          "primary-foreground": "#FFFFFF",
          accent: "#D9D8FD",
          "accent-foreground": "#4D475B",
          border: "#D9D8FD",
          ring: "#833ADF",
        },
      },
      borderRadius: {
        ...defaultConfig.theme.extend.borderRadius,
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        ...defaultConfig.theme.extend.keyframes,
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        ...defaultConfig.theme.extend.animation,
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [...defaultConfig.plugins, require("tailwindcss-animate")],
}

export default config
