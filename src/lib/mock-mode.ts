/**
 * When true, API routes and workspace use in-memory mock data (no DATABASE_URL).
 * Set in .env: USE_MOCK_DATA=true
 * Optional UI hint: NEXT_PUBLIC_USE_MOCK=true
 */
export function isMockMode(): boolean {
  return (
    process.env.USE_MOCK_DATA === "true" ||
    process.env.NEXT_PUBLIC_USE_MOCK === "true"
  );
}
