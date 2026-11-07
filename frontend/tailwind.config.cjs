/** @type {import('tailwindcss').Config} */
// As telas dos módulos (ex.: Gestão de Leitos, Malária) usam classes Tailwind.
// O preflight (reset global) fica DESLIGADO para não alterar as telas feitas
// com estilo inline; o reset mínimo necessário está em src/styles/tailwind.css.
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
