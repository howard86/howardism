export interface LanguageListItemProps {
  name: string;
  proficiency: string;
}

export function LanguageListItem({ name, proficiency }: LanguageListItemProps) {
  return (
    <li className="flex items-center gap-1">
      <h3 className="font-bold text-2xs">{name}</h3>
      <p className="text-2xs"> ({proficiency})</p>
    </li>
  );
}
