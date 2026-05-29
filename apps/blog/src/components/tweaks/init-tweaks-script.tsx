import { TWEAKS_STORAGE_KEY } from "./types";

export const INIT_TWEAKS_SCRIPT = `(function(){try{
  var s=localStorage.getItem('${TWEAKS_STORAGE_KEY}');
  if(!s)return;
  var t=JSON.parse(s);
  if(t.mode==='dark')document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  if(t.textSize)document.documentElement.dataset.textSize=t.textSize;
}catch(e){}})();`;

export function InitTweaksScript() {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional no-FOUC inline script
    <script dangerouslySetInnerHTML={{ __html: INIT_TWEAKS_SCRIPT }} />
  );
}
