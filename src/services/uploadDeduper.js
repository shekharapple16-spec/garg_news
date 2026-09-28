export function getMediaUploadKey(file) {
  if (!file || typeof file !== 'object') {
    return null
  }

  const name = file.name || 'unnamed-media'
  const size = Number(file.size) || 0
  const lastModified = Number(file.lastModified) || 0
  const type = file.type || ''

  return `${name}:${size}:${lastModified}:${type}`
}

export function createUploadDeduper() {
  const pendingUploads = new Map()

  return {
    wrap(key, executor) {
      if (!key) {
        return Promise.resolve().then(executor)
      }

      if (pendingUploads.has(key)) {
        return pendingUploads.get(key)
      }

      const uploadPromise = Promise.resolve().then(executor)
      pendingUploads.set(key, uploadPromise)

      return uploadPromise.finally(() => {
        pendingUploads.delete(key)
      })
    },
  }
}

export const uploadDeduper = createUploadDeduper()
