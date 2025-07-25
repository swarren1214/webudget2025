/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite-react/lib/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js" // ✅ Add this line for core Flowbite support
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ...other custom colors...
      },
      keyframes: {
        // ... your keyframes config ...
      },
      animation: {
        // ... your animation config ...
      },
      backgroundImage: {
        'big-grinch': 'linear-gradient(270deg, #1DCC67 0.19%, #009F23 99.92%)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("flowbite/plugin") // ✅ Flowbite plugin
  ],
};
