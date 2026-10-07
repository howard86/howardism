// `DEPLOY_TARGET=pages` builds the static-export GitHub Pages backup: no
// headers/redirects, noindex, no Vercel Analytics. Unset is the Vercel build.
export const isPagesExport = process.env.DEPLOY_TARGET === "pages";
