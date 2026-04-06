export interface SkillListItemProps {
  items: string[];
  title: string;
}

export function SkillListItem({ title, items }: SkillListItemProps) {
  return (
    <li>
      <h3 className="font-bold text-2xs">{title}</h3>
      <p className="text-2xs leading-4">{items.join(", ")}</p>
    </li>
  );
}
