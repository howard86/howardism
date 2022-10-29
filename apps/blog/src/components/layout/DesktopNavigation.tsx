import { DivProps } from "react-html-props";

import { SECTION_KEYS, SectionId } from "@/constants/nav";

import NavItem from "./NavItem";

interface DesktopNavigationProps extends DivProps {
  activeSectionId: string;
}

export default function DesktopNavigation({ activeSectionId, ...props }: DesktopNavigationProps) {
  return (
    <nav {...props}>
      <ul className="flex rounded-full bg-white/90 px-3 text-sm font-medium text-zinc-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
        {SECTION_KEYS.map((key) => (
          <NavItem
            key={key}
            href={`#${SectionId[key]}`}
            isActive={activeSectionId === SectionId[key]}
          >
            {key}
          </NavItem>
        ))}
      </ul>
    </nav>
  );
}
