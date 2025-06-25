/**
 * squareClient.ts
 *
 * Wraps the Square “legacy” SDK into a simple factory:
 * - Dynamically requires "square/legacy" so TS won’t choke
 * - Picks Sandbox vs. Production based on applicationId prefix
 * - Injects the provided accessToken
 * - Throws if the SDK fails to load
 */
export function getSquareClient(
  applicationId: string,
  accessToken: string
): any {
  // @ts-ignore: dynamic require of CommonJS package
  const { Client, Environment } = require("square/legacy");
  if (typeof Client !== "function" || !Environment) {
    throw new Error("Failed to load Square legacy SDK");
  }

  const environment = applicationId.startsWith("sandbox-")
    ? Environment.Sandbox
    : Environment.Production;

  return new Client({ environment, accessToken });
}
