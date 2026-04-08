import { RouteLink } from "@howardism/components-common";
import type { LucideIcon } from "lucide-react";

interface InfoListProps {
  icon?: LucideIcon;
  name: string;
  url?: string;
}

export default function InfoList({ name, icon: Icon, url }: InfoListProps) {
  return (
    <li className="flex items-center gap-1 text-base sm:text-lg">
      {Icon && <Icon className="size-5" />}
      {url ? (
        <a href={url} rel="noopener noreferrer" target="_blank">
          {name}
        </a>
      ) : (
        <RouteLink href={`/user/${name}`}>{name}</RouteLink>
      )}
    </li>
  );
}
