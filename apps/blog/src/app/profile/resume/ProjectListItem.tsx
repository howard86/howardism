export interface ProjectListItemProps {
  name: string
  description: string
  items: string[]
}

export function ProjectListItem({ name, description, items }: ProjectListItemProps) {
  return (
    <li>
      <div>
        <h3 className="inline text-xs font-bold">{name}</h3> —{" "}
        <em className="text-xs">{description}</em>
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
