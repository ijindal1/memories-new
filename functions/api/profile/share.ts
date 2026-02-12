import type { Env, UserData } from "../../types";
import { buildSharePayload, encodeShareToken, loadProfileData } from "./_helpers";

// GET /api/profile/share — generate a shareable link for the authenticated user's profile snapshot
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = context.data.user as UserData | undefined;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await loadProfileData(context.env, user);
  const shareProfile = buildSharePayload(profile);
  const token = encodeShareToken(shareProfile);

  const baseUrl = context.env.APP_URL?.replace(/\/$/, "") ?? "";
  const sharePath = `/api/profile/share/${token}`;
  const shareUrl = baseUrl ? `${baseUrl}${sharePath}` : sharePath;

  return Response.json({
    share_url: shareUrl,
    token,
    profile: shareProfile,
  });
};
