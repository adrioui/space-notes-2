import { supabase } from './supabase'

export class SupabaseStorageManager {
  private readonly buckets = {
    avatars: 'avatars',
    attachments: 'attachments',
    wallpapers: 'wallpapers',
  } as const

  // Upload avatar image
  async uploadAvatar(file: File, userId: string): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(this.buckets.avatars)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
      .from(this.buckets.avatars)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  }

  // Upload message attachment
  async uploadAttachment(
    file: File,
    spaceId: string,
    messageId: string
  ): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${file.name.replace(/\.[^/.]+$/, '')}-${Date.now()}.${fileExt}`
    const filePath = `${spaceId}/${messageId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(this.buckets.attachments)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(`Failed to upload attachment: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
      .from(this.buckets.attachments)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  }

  // Upload space wallpaper
  async uploadWallpaper(file: File, spaceId: string): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop()
    const fileName = `wallpaper-${Date.now()}.${fileExt}`
    const filePath = `${spaceId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(this.buckets.wallpapers)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      throw new Error(`Failed to upload wallpaper: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
      .from(this.buckets.wallpapers)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  }

  // Delete file from storage
  async deleteFile(bucket: keyof typeof this.buckets, path: string): Promise<void> {
    const { error } = await supabase.storage.from(this.buckets[bucket]).remove([path])

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  // Get file URL
  getFileUrl(bucket: keyof typeof this.buckets, path: string): string {
    const { data } = supabase.storage.from(this.buckets[bucket]).getPublicUrl(path)
    return data.publicUrl
  }

  // Create signed URL for private files (if needed)
  async createSignedUrl(
    bucket: keyof typeof this.buckets,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.buckets[bucket])
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  }
}

// Create singleton instance
export const storageManager = new SupabaseStorageManager()