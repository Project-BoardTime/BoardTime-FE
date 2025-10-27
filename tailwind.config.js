/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- ⬇️ 새로운 컬러 팔레트 ⬇️ ---
        "board-primary": "#8C4B38", // 메인 다크 브라운
        "board-secondary": "#A97458", // 중간 브라운
        "board-dark": "#3B2F2F", // 거의 검정에 가까운 아주 진한 브라운
        "board-light": "#F5EFE6", // 밝은 크림색 (배경, 텍스트)
        "board-accent-green": "#B4C4B4", // 액센트 그린
        "board-accent-gold": "#D4AF37", // 액센트 골드
        // --- ⬆️ 새로운 컬러 팔레트 끝 ⬆️ ---
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
