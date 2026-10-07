export function safeRedirectPath(
  value: string | string[] | undefined,
  fallback = "/account",
) {
  const path = Array.isArray(value) ? value[0] : value;
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return fallback;
  }
  return path;
}