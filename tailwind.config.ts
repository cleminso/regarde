import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"], // Standard Shadcn UI setting
  content: [
    "./index.html", // Your existing content path
    "./src/**/*.{js,ts,jsx,tsx}", // Your existing content path
    // Add other paths if Shadcn components are located elsewhere, e.g.:
    // './pages/**/*.{ts,tsx}',
    // './components/**/*.{ts,tsx}', // If you create a global components folder for Shadcn
    // './app/**/*.{ts,tsx}',
  ],
  prefix: "", // Standard Shadcn UI setting (can be customized)
  theme: {
    container: {
      // Shadcn UI typically defines a base container
      center: true,
      padding: "2rem", // Default Shadcn padding
      screens: {
        // Default Shadcn screens for container
        "2xl": "1400px",
      },
    },
    extend: {
      // Your original container settings can be merged or specified here
      // to extend/override the base container settings.
      // For example, to add your specific screen sizes to the container:
      screens: {
        lg: "600px", // Your custom screen
        xl: "600px", // Your custom screen
      },
      // To add/override padding for the container:
      padding: {
        DEFAULT: "0.75rem", // Your custom default padding
        sm: "1rem", // Your custom sm padding
      },

      // Shadcn UI color definitions
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate], // Use the imported plugin
} satisfies Config; // Using "satisfies Config" provides good type checking

export default config;
