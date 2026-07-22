const LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function getAllowedOrigins(dev: boolean) {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  return new Set([
    ...configuredOrigins,
    ...(appOrigin ? [appOrigin] : []),
    ...(dev ? LOCAL_ORIGINS : []),
  ]);
}

export function isSocketOriginAllowed(
  origin: string | undefined,
  dev: boolean,
) {
  if (!origin) {
    return dev;
  }

  return getAllowedOrigins(dev).has(origin);
}
