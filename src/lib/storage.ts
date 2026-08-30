import { uploadFile } from '@/lib/api';

export type StorageBucket = 'avatars' | 'cvs' | 'job-images';

export async function uploadUserFile(
  _bucket: StorageBucket,
  _userId: string,
  file: File,
): Promise<{ url: string | null; error?: string }> {
  try {
    const url = await uploadFile(file);
    return { url };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Yükleme hatası' };
  }
}
