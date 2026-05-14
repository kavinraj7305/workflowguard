import { SignJWT, jwtVerify } from "jose";

export const EXTENSION_TOKEN_TYP = "wfg_extension" as const;

export type VerifiedExtensionToken = {
  sub: string;
  orgId: string;
  ticketId: string;
};

function getSecretKey() {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(raw);
}

/** Short-lived token for the browser extension to POST ticket activity (Bearer). */
export async function createExtensionToken(input: {
  sub: string;
  orgId: string;
  ticketId: string;
}): Promise<string> {
  return new SignJWT({
    orgId: input.orgId,
    ticketId: input.ticketId,
    typ: EXTENSION_TOKEN_TYP,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());
}

export async function verifyExtensionToken(
  token: string
): Promise<VerifiedExtensionToken | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const orgId = typeof payload.orgId === "string" ? payload.orgId : null;
    const ticketId = typeof payload.ticketId === "string" ? payload.ticketId : null;
    const typ = payload.typ;
    if (
      !sub ||
      !orgId ||
      !ticketId ||
      typ !== EXTENSION_TOKEN_TYP
    ) {
      return null;
    }
    return { sub, orgId, ticketId };
  } catch {
    return null;
  }
}

export function parseBearerAuth(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  const t = h.slice(7).trim();
  return t.length ? t : null;
}
