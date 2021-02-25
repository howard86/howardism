const MAX_CONTENT_LENGTH = 300;

type UnknownObject = { [key in string]: unknown };

export const filterNullValue = <T extends UnknownObject>(obj: T): T => {
  const newObj: UnknownObject = {};

  Object.keys(obj).forEach((key) => {
    if (obj[key] !== null) {
      newObj[key] = obj[key];
    }
  });

  return newObj as T;
};

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
