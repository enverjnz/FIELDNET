import { supabase } from './supabase';

export const STORAGE_BUCKETS = {
  profileAvatars: 'profile_avatars',
  teamLogos: 'team_logos',
  postImages: 'post_images',
} as const;

export function isLocalImageUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Bild konnte nicht gelesen werden.');
  }
  return response.arrayBuffer();
}

function extensionFromUri(uri: string): string {
  const match = uri.match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
  if (!match) return 'jpg';
  const ext = match[1].toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

function contentTypeForExt(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

async function uploadImage(
  bucket: string,
  path: string,
  localUri: string,
): Promise<string> {
  const ext = extensionFromUri(localUri);
  const fullPath = path.includes('.') ? path : `${path}.${ext}`;
  const arrayBuffer = await uriToArrayBuffer(localUri);

  const { error } = await supabase.storage.from(bucket).upload(fullPath, arrayBuffer, {
    contentType: contentTypeForExt(ext),
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadProfileAvatar(userId: string, localUri: string): Promise<string> {
  return uploadImage(STORAGE_BUCKETS.profileAvatars, `${userId}/avatar`, localUri);
}

export async function uploadTeamLogo(teamId: string, localUri: string): Promise<string> {
  return uploadImage(STORAGE_BUCKETS.teamLogos, `${teamId}/logo`, localUri);
}

export async function uploadPostImage(postId: string, localUri: string): Promise<string> {
  return uploadImage(STORAGE_BUCKETS.postImages, `${postId}/${Date.now()}`, localUri);
}

/** Lokalen URI hochladen oder bestehende Remote-URL unverändert zurückgeben. */
export async function resolveProfileAvatarUrl(
  userId: string,
  uri: string | null | undefined,
): Promise<string | null> {
  if (!uri?.trim()) return null;
  if (isLocalImageUri(uri)) return uploadProfileAvatar(userId, uri);
  return uri.trim();
}

/** Lokalen URI hochladen oder bestehende Remote-URL unverändert zurückgeben. */
export async function resolveTeamLogoUrl(
  teamId: string,
  uri: string | null | undefined,
): Promise<string | null> {
  if (!uri?.trim()) return null;
  if (isLocalImageUri(uri)) return uploadTeamLogo(teamId, uri);
  return uri.trim();
}
