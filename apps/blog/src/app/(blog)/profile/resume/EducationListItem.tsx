export interface EducationListItemProps {
  degree: string;
  endDate: string;
  facility: string;
  items: string[];
  location: string;
  startDate: string;
}

export function EducationListItem({
  facility,
  degree,
  location,
  startDate,
  endDate,
  items,
}: EducationListItemProps) {
  return (
    <li>
      <div>
        <h3 className="font-bold text-2xs">
          {facility}, {location}
        </h3>
        <em className="text-xs">{degree}</em>
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
