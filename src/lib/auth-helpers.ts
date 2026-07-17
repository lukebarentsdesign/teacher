import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function createUnauthorizedError(message = "Unauthorized") {
  return new UnauthorizedError(message);
}

export function createForbiddenError(message = "Forbidden") {
  return new ForbiddenError(message);
}

import type { LegacyAuthSession } from "@/auth";

export type AuthContext = NonNullable<LegacyAuthSession>;

/**
 * Ensures the request has a valid session and returns an AuthContext.
 * @param headers The request headers
 * @returns The session object (AuthContext)
 * @throws UnauthorizedError if no valid session is found
 */
export async function requireSession(headers: Headers): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw createUnauthorizedError();
  }

  return session;
}

/**
 * Ensures the authenticated user holds the global PLATFORM_ADMIN role.
 */
export async function requirePlatformAdmin(context: AuthContext): Promise<AuthContext> {
  if (context.user.role !== "PLATFORM_ADMIN") {
    throw createForbiddenError("Global administrator privileges required.");
  }
  return context;
}

/**
 * Ensures the authenticated user is currently acting within the context of the requested organisation.
 */
export async function requireOrganisationMember(context: AuthContext, organisationId: string): Promise<AuthContext> {
  const activeOrgId = context.session.activeOrganizationId;
  if (!activeOrgId || activeOrgId !== organisationId) {
    throw createForbiddenError("You are not currently acting within the requested organisation.");
  }
  return context;
}

/**
 * Convenience helper to combine getting the session and ensuring org membership.
 */
export async function requireOrganisationContext(args: { headers: Headers, organisationId: string, permission?: string }) {
  const context = await requireSession(args.headers);
  await requireOrganisationMember(context, args.organisationId);
  
  if (args.permission) {
    // A placeholder for actual permission logic when Better Auth roles are mapped
    // if (!context.user.permissions.includes(args.permission)) throw new ForbiddenError();
  }
  
  return context;
}
