const MAX_CONTENT_LENGTH = 300;

export const filterNullValue = <T extends { [key in string]: unknown }>(obj: T): T =>
  Object.fromEntries(
    Object.keys(obj)
      .filter((key) => obj[key] !== null)
      .map((key) => [key, obj[key]])
  ) as T;

export const filterLongContent = (text: string): string => {
  if (text.length <= MAX_CONTENT_LENGTH) {
    return text;
  }

  const subText = text.substring(0, text.indexOf(" ", MAX_CONTENT_LENGTH));

  if (subText.endsWith(".")) {
    return subText + "..";
  }

  return subText + "...";
};
