// `pages` is the canonical, indexed GitHub Pages export (www.howard86.com);
// `vercel` is the noindex static-export fallback whose canonicals point there.
// Both omit Next.js headers/redirects, which Vercel config adds.
export const isPagesExport = process.env.DEPLOY_TARGET === "pages";
export const isVercelStatic = process.env.DEPLOY_TARGET === "vercel";
export const isStaticExport = isPagesExport || isVercelStatic;
