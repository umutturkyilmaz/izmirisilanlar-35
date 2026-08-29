import supabase from '@/lib/supabase';

export type StorageBucket = 'avatars' | 'cvs' | 'job-images';

export async function uploadUserFile(
  bucket: StorageBucket,
  userId: string,
  file: File,
  folder?: string
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = folder ? `${userId}/${folder}/${safeName}` : `${userId}/${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    return {
      url: null,
      error:
        error.message.includes('Bucket not found') || error.message.includes('not found')
          ? `Depolama alanı (${bucket}) henüz oluşturulmamış. Supabase Storage'da bucket açılmalı.`
          : error.message,
    };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
