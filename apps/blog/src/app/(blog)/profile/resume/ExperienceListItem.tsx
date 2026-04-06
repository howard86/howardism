export interface ExperienceListItemProps {
  company: string;
  endDate?: string;
  items: string[];
  location: string;
  size: string;
  startDate: string;
  title: string;
}

export function ExperienceListItem({
  company,
  location,
  title,
  size,
  startDate,
  endDate = "present",
  items,
}: ExperienceListItemProps) {
  return (
    <li>
      <div>
        <h3 className="inline font-bold text-xs">{company}</h3>
        <span className="text-xs">
          , {location} — <em>{title}</em>
          <span className="ml-1 text-3xs">(size: {size})</span>
        </span>
        <p className="text-2xs uppercase">
          {startDate} - {endDate}
        </p>
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
