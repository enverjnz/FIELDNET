import { supabase } from './supabase';
import { uploadProfileGalleryMedia } from './uploadImage';

export type ProfileMediaItem = {
  id: string;
  profile_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
};

export async function fetchProfileMedia(profileId: string): Promise<ProfileMediaItem[]> {
  const { data, error } = await supabase
    .from('profile_media')
    .select('id, profile_id, media_url, media_type, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProfileMediaItem[];
}

export async function addProfileMedia(
  profileId: string,
  localUri: string,
  preferredType?: 'image' | 'video',
): Promise<ProfileMediaItem> {
  const { url, mediaType } = await uploadProfileGalleryMedia(profileId, localUri, preferredType);

  const { data, error } = await supabase
    .from('profile_media')
    .insert({
      profile_id: profileId,
      media_url: url,
      media_type: preferredType ?? mediaType,
    })
    .select('id, profile_id, media_url, media_type, created_at')
    .single();

  if (error) throw error;
  return data as ProfileMediaItem;
}

export async function deleteProfileMedia(mediaId: string): Promise<void> {
  const { error } = await supabase
    .from('profile_media')
    .delete()
    .eq('id', mediaId);

  if (error) throw error;
}
