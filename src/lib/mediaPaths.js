export function getStoragePathFromPublicUrl(publicUrl) {
  if (typeof publicUrl !== 'string') {
    return null
  }

  const trimmedUrl = publicUrl.trim()
  if (!trimmedUrl || !trimmedUrl.includes('supabase.co/storage/v1/object/public/news-image/')) {
    return null
  }

  try {
    const url = new URL(trimmedUrl)
    const bucketPrefix = '/storage/v1/object/public/news-image/'
    const path = decodeURIComponent(url.pathname)
    const indexOfBucket = path.indexOf(bucketPrefix)

    if (indexOfBucket < 0) {
      return null
    }

    const storagePath = path.slice(indexOfBucket + bucketPrefix.length).replace(/^\/+|\/+$/g, '')
    if (!storagePath || storagePath.includes('..') || storagePath.startsWith('/')) {
      return null
    }

    return storagePath
  } catch {
    return null
  }
}
