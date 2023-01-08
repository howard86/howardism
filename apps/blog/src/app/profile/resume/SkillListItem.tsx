export interface SkillListItemProps {
  category: string
  items: string[]
}

export function SkillListItem({ category, items }: SkillListItemProps) {
  return (
    <li>
      <h3 className="text-2xs font-bold">{category}</h3>
      <p className="text-2xs leading-4">{items.join(", ")}</p>
    </li>
  )
}
