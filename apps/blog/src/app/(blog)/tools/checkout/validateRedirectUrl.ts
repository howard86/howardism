export const validateRedirectUrl = (data: string, origin: string): string => {
  const redirectUrl = new URL(data, origin);
  if (redirectUrl.origin !== origin) {
    throw new Error("Redirect to external URL is not allowed");
  }
  return redirectUrl.href;
};
