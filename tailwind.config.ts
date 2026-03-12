import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#ff3e00",
                background: "#0d0d0d",
                surface: "#1a1a1a",
            },
        },
    },
    plugins: [],
};
export default config;
