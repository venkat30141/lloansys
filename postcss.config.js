import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

/** PostCSS config for Tailwind CSS v4+ */
export default {
  plugins: [tailwindcss(), autoprefixer()],
};
