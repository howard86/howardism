export interface ProjectListItemProps {
  title: string
  subtitle: string
  items: string[]
}

export function ProjectListItem({ title, subtitle, items }: ProjectListItemProps) {
  return (
    <li>
      <div>
        <h3 className="inline text-xs font-bold">{title}</h3> —{" "}
        <em className="text-xs">{subtitle}</em>
        <ul className="list-outside list-disc text-2xs">
          {items.map((item) => (
            <li key={item} className="ml-4">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
