import matchIcon from "@/utils/match-icons";

interface ProfileFieldProps {
  fieldKey: string;
  fieldValue: string | number;
}

export default function ProfileField({
  fieldKey,
  fieldValue,
}: ProfileFieldProps) {
  if (fieldValue === null || fieldValue === "") {
    return null;
  }

  const IconComponent = matchIcon(fieldKey);

  return (
    <div className="my-1 flex text-base sm:my-2 sm:text-lg">
      <h2 className="flex w-36 items-center gap-1 font-medium capitalize">
        <IconComponent className="size-4" />
        {/* TODO: fix this quick workaround */}
        {fieldKey.replace("Username", "")}
      </h2>
      <span className="w-36 truncate" title={String(fieldValue)}>
        {fieldValue}
      </span>
    </div>
  );
}
