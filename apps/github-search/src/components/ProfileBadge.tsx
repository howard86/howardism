import matchIcon from "@/utils/match-icons";

interface ProfileBadgeProps {
  name: string;
}

export default function ProfileBadge({ name }: ProfileBadgeProps) {
  const IconComponent = matchIcon(name);

  return (
    <span title={name}>
      <IconComponent className="size-8" />
    </span>
  );
}
