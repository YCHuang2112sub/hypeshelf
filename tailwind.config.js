/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "cyber-cyan": "#00F2FF",
                "neon-violet": "#8B5CF6",
                "deep-black": "#05050A",
                "glass-white": "rgba(255,255,255,0.04)",
            },
            fontFamily: {
                mono: ["var(--font-mono)", "monospace"],
            },
            boxShadow: {
                "cyan-glow": "0 0 20px rgba(0, 242, 255, 0.35)",
                "violet-glow": "0 0 20px rgba(139, 92, 246, 0.35)",
                "card-glow": "0 0 40px rgba(0, 242, 255, 0.08)",
            },
        },
    },
    plugins: [],
};
