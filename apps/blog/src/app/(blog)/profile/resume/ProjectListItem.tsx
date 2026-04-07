export interface ProjectListItemProps {
  items: string[];
  subtitle: string;
  title: string;
}

export function ProjectListItem({
  title,
  subtitle,
  items,
}: ProjectListItemProps) {
  return (
    <li>
      <div>
        <h3 className="inline font-bold text-xs">{title}</h3> —{" "}
        <em className="text-xs">{subtitle}</em>
        <ul className="list-outside list-disc text-2xs">
          {items.map((item) => (
            <li className="ml-4" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
