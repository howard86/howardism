export interface LanguageListItemProps {
  name: string
  level: string
}

export function LanguageListItem({ name, level }: LanguageListItemProps) {
  return (
    <li className="flex items-center gap-1">
      <h3 className="text-2xs font-bold">{name}</h3>
      <p className="text-2xs"> ({level})</p>
    </li>
  )
}
