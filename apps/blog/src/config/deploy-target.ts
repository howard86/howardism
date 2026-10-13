// `pages` is the noindex GitHub Pages backup; `vercel` is the indexed Vercel
// static export. Both omit Next.js headers/redirects, which Vercel config adds.
export const isPagesExport = process.env.DEPLOY_TARGET === "pages";
export const isVercelStatic = process.env.DEPLOY_TARGET === "vercel";
export const isStaticExport = isPagesExport || isVercelStatic;
