import { supabase } from '../lib/supabase'
import { normalizeHeadlineRichText, normalizePlainTextContent, normalizeRichTextContent } from '../lib/translation'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 25 * 1024 * 1024

export async function fetchPublishedNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Unable to load the latest news right now.')
  }

  return data ?? []
}

export async function fetchAllNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Unable to load the newsroom right now.')
  }

  return data ?? []
}

export async function uploadNewsMedia(file) {
  if (!file) {
    throw new Error('Please choose an image or MP4 video before publishing.')
  }

  const fileType = file.type.toLowerCase()
  const isVideo = fileType.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4')
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES

  if (!allowedTypes.includes(fileType)) {
    if (isVideo) {
      throw new Error('Only MP4 videos are allowed.')
    }

    throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.')
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    if (isVideo) {
      throw new Error('Video is too large. Please choose a file under 25MB.')
    }

    throw new Error('Image is too large. Please choose a file under 5MB.')
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() : isVideo ? 'mp4' : 'jpg'
  const uniqueName = `news-${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('news-image')
    .upload(uniqueName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw new Error(uploadError.message || 'Media upload failed. Please try again.')
  }

  const { data: publicUrlData } = supabase.storage.from('news-image').getPublicUrl(uniqueName)

  if (!publicUrlData?.publicUrl) {
    throw new Error('Media URL could not be generated after upload.')
  }

  return publicUrlData.publicUrl
}

export async function uploadNewsImage(file) {
  return uploadNewsMedia(file)
}

const getISTNow = () => {
  const now = new Date()
  const offsetMinutes = 330
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utcTime + offsetMinutes * 60000).toISOString()
}

export async function publishNewsArticle({
  title,
  content,
  imageUrl,
  isBreaking = false,
  isFeatured = false,
  language = 'hindi',
}) {
  const sanitizedContent = normalizePlainTextContent(normalizeRichTextContent(content) || content)

  if (!title?.trim()) {
    throw new Error('Headline is required before publishing.')
  }

  if (!sanitizedContent) {
    throw new Error('News content is required before publishing.')
  }

  if (!imageUrl) {
    throw new Error('Please upload a news image before publishing.')
  }

  const headlineHtml = normalizeHeadlineRichText(title || '')

  const payload = {
    title: headlineHtml.trim(),
    content: sanitizedContent.trim(),
    image_url: imageUrl,
    is_breaking: Boolean(isBreaking),
    is_featured: Boolean(isFeatured),
    status: 'published',
    published_at: getISTNow(),
    language: String(language || 'hindi').toLowerCase(),
  }

  let data
  let error
  try {
    ;({ data, error } = await supabase.from('news').insert([payload]).select())
  } catch (insertError) {
    error = insertError
  }

  if (error) {
    if (String(error.message).includes('language')) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.language
      ;({ data, error } = await supabase.from('news').insert([fallbackPayload]).select())
    }
  }

  if (error) {
    throw new Error(error.message || 'The article could not be saved. Please try again.')
  }

  return data?.[0] ?? null
}

export async function updateNewsArticle({
  id,
  title,
  content,
  imageUrl,
  isBreaking = false,
  isFeatured = false,
  language = 'hindi',
}) {
  const sanitizedContent = normalizePlainTextContent(normalizeRichTextContent(content) || content)

  if (!id) {
    throw new Error('Article ID is required to update the news item.')
  }

  if (!title?.trim()) {
    throw new Error('Headline is required before saving changes.')
  }

  if (!sanitizedContent) {
    throw new Error('News content is required before saving changes.')
  }

  if (!imageUrl) {
    throw new Error('Please keep or upload a news image before saving.')
  }

  const headlineHtml = normalizeHeadlineRichText(title || '')

  const payload = {
    title: headlineHtml.trim(),
    content: sanitizedContent.trim(),
    image_url: imageUrl,
    is_breaking: Boolean(isBreaking),
    is_featured: Boolean(isFeatured),
    updated_at: new Date().toISOString(),
    language: String(language || 'hindi').toLowerCase(),
  }

  let data
  let error
  try {
    ;({ data, error } = await supabase.from('news').update(payload).eq('id', id).select())
  } catch (updateError) {
    error = updateError
  }

  if (error) {
    if (String(error.message).includes('language')) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.language
      ;({ data, error } = await supabase.from('news').update(fallbackPayload).eq('id', id).select())
    }
  }

  if (error) {
    throw new Error(error.message || 'The article could not be updated. Please try again.')
  }

  return data?.[0] ?? null
}

export async function updateNewsStatus({ id, status }) {
  if (!id) {
    throw new Error('Article ID is required to update the article status.')
  }

  const nextStatus = status === 'published' ? 'published' : 'draft'
  const payload = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
    ...(nextStatus === 'published' && { published_at: getISTNow() }),
  }

  const { data, error } = await supabase
    .from('news')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) {
    throw new Error(error.message || 'The article status could not be updated.')
  }

  return data?.[0] ?? null
}

export async function deleteNewsArticle(id) {
  if (!id) {
    throw new Error('Article ID is required to delete the news item.')
  }

  const { error } = await supabase.from('news').delete().eq('id', id)

  if (error) {
    throw new Error(error.message || 'The article could not be deleted.')
  }
}
