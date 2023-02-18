export interface EducationListItemProps {
  facility: string
  degree: string
  location: string
  startDate: string
  endDate: string
  items: string[]
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
        <h3 className="text-2xs font-bold">
          {facility}, {location}
        </h3>
        <em className="text-xs">{degree}</em>
        <p className="text-2xs uppercase ">
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
  )
}
