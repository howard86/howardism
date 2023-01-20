export interface SkillListItemProps {
  title: string
  items: string[]
}

export function SkillListItem({ title, items }: SkillListItemProps) {
  return (
    <li>
      <h3 className="text-2xs font-bold">{title}</h3>
      <p className="text-2xs leading-4">{items.join(", ")}</p>
    </li>
  )
}
