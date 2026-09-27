export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4']
export const MAX_IMAGE_SIZE = 12 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 1800
export const OPTIMIZED_IMAGE_TARGET_BYTES = 450 * 1024
export const OPTIMIZED_IMAGE_MAX_BYTES = 800 * 1024
export const MAX_VIDEO_SIZE = 15 * 1024 * 1024

export function isImageFile(file) {
  if (!file) {
    return false
  }

  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  return ALLOWED_IMAGE_TYPES.includes(type) || /\.(jpe?g|png|webp)$/i.test(name)
}

export function isVideoFile(file) {
  if (!file) {
    return false
  }

  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  return type === 'video/mp4' || name.endsWith('.mp4') || name.endsWith('.m4v')
}

export function getImageMimeType(file) {
  const type = (file?.type || '').toLowerCase()
  const name = (file?.name || '').toLowerCase()

  if (type === 'image/png' || name.endsWith('.png')) return 'image/png'
  if (type === 'image/webp' || name.endsWith('.webp')) return 'image/webp'
  if (type === 'image/jpeg' || type === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  return null
}

export function supportsWebP() {
  if (typeof document === 'undefined') {
    return false
  }

  const canvas = document.createElement('canvas')
  return typeof canvas.toDataURL === 'function' && canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

export const getImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('Unsupported file type.'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
      img.onerror = () => reject(new Error('Image could not be decoded.'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Image could not be read.'))
    reader.readAsDataURL(file)
  })

export async function validateMediaSelection(file, { allowVideo = true } = {}) {
  if (!file) {
    throw new Error('Please choose a file before continuing.')
  }

  if (isVideoFile(file)) {
    if (!allowVideo) {
      throw new Error('Video uploads are not allowed for this field.')
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error(`Video is too large. Please keep it under ${Math.round(MAX_VIDEO_SIZE / (1024 * 1024))} MB.`)
    }

    return { kind: 'video', file }
  }

  if (!isImageFile(file)) {
    throw new Error('Only JPG, JPEG, PNG, and WEBP images are supported.')
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image is too large. Please keep it under ${Math.round(MAX_IMAGE_SIZE / (1024 * 1024))} MB.`)
  }

  try {
    const { width, height } = await getImageDimensions(file)
    if (width > 5000 || height > 5000) {
      throw new Error('Image dimensions are too large. Please upload a smaller photo.')
    }
  } catch (error) {
    throw new Error(error.message || 'The selected image could not be validated.')
  }

  return { kind: 'image', file }
}

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Image could not be decoded.'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Image could not be read.'))
    reader.readAsDataURL(file)
  })

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      mimeType,
      quality,
    )
  })

export async function optimizeNewsImageFile(file) {
  if (!isImageFile(file)) {
    return file
  }

  const sourceMimeType = getImageMimeType(file)
  if (!sourceMimeType) {
    return file
  }

  try {
    const image = await loadImageFromFile(file)
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    const maxDimension = Math.max(width, height)

    if (file.size <= 700 * 1024 && maxDimension <= 1400) {
      return file
    }

    const shouldResize = maxDimension > MAX_IMAGE_DIMENSION || file.size > 900 * 1024
    const canvas = document.createElement('canvas')
    canvas.width = shouldResize ? Math.max(1, Math.round(width * (MAX_IMAGE_DIMENSION / maxDimension))) : width
    canvas.height = shouldResize ? Math.max(1, Math.round(height * (MAX_IMAGE_DIMENSION / maxDimension))) : height

    const context = canvas.getContext('2d')
    if (!context) {
      return file
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const targetMimeType = supportsWebP() ? 'image/webp' : 'image/jpeg'
    let quality = targetMimeType === 'image/webp' ? 0.8 : 0.75
    let blob = await canvasToBlob(canvas, targetMimeType, quality)

    if (!blob) {
      return file
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (blob.size <= OPTIMIZED_IMAGE_TARGET_BYTES || (blob.size <= OPTIMIZED_IMAGE_MAX_BYTES && attempt >= 2)) {
        break
      }

      quality = Math.max(0.4, quality - 0.1)
      blob = await canvasToBlob(canvas, targetMimeType, quality)
      if (!blob) {
        break
      }
    }

    const baseName = (file.name || 'news-image').replace(/\.[^/.]+$/, '') || 'news-image'
    const outputType = blob && blob.type ? blob.type : targetMimeType
    const extension = outputType === 'image/webp' ? 'webp' : 'jpg'

    return new File([blob], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
