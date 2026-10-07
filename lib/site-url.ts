// The public address of the site, used for canonical links and search-engine data.
// It reuses the BETTER_AUTH_URL setting, which already holds the site's address.
export function getSiteUrl() {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}