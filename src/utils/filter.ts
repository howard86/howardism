export const filterNullValue = <T extends { [key in string]: unknown }>(obj: T): T =>
  Object.fromEntries(
    Object.keys(obj)
      .filter((key) => obj[key] !== null)
      .map((key) => [key, obj[key]])
  ) as T;
