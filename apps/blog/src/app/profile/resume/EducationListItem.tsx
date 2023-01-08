export interface EducationListItemProps {
  name: string
  degree: string
  startMonth: string
  endMonth: string
  items: string[]
}

export function EducationListItem({
  name,
  degree,
  startMonth,
  endMonth,
  items,
}: EducationListItemProps) {
  return (
    <li>
      <div>
        <h3 className="text-2xs font-bold">{name}</h3>
        <em className="text-xs">{degree}</em>
        <p className="text-2xs uppercase ">
          {startMonth} - {endMonth}
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
