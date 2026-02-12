import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Env, UserData } from "../types";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(projectId: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://api.descope.com/${projectId}/.well-known/jwks.json`)
    );
  }
  return jwks;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const auth = context.request.headers.get("Authorization");

  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const projectId = context.env.DESCOPE_PROJECT_ID;
      const { payload } = await jwtVerify(
        token,
        getJWKS(projectId),
        { issuer: [projectId, `https://api.descope.com/${projectId}`] }
      );
      context.data.user = {
        sub: payload.sub!,
        email: (payload as any).email,
        name: (payload as any).name,
      } satisfies UserData;
    } catch {
      // Invalid token — user stays unauthenticated
    }
  }

  return context.next();
};
