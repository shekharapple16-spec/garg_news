import { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import {
  detectPunjabiLanguage,
  normalizeHeadlineRichText,
  normalizePlainTextContent,
  normalizeRichTextContent,
  transliterateHindiToPunjabi,
  transliterateHtmlToPunjabi,
  transliteratePunjabiToHindi,
} from '../lib/translation'
import { uploadNewsMedia, publishNewsArticle, updateNewsArticle } from '../services/newsService'

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/webp,video/mp4'

const isVideoAsset = (value) => {
  if (typeof value !== 'string') {
    return false
  }

  const normalized = value.toLowerCase()
  return /\.(mp4|m4v)(\?.*)?$/.test(normalized) || normalized.includes('/video/') || normalized.includes('video')
}

const isImageAsset = (value) => {
  if (typeof value !== 'string') {
    return false
  }

  const normalized = value.toLowerCase()
  return /\.(jpe?g|png|webp|gif)(\?.*)?$/.test(normalized)
}

const getMediaTypeFromUrl = (value) => {
  if (isVideoAsset(value)) {
    return 'video'
  }

  if (isImageAsset(value)) {
    return 'image'
  }

  return null
}

const getDirectMediaUrl = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    const cleanUrl = parsed.toString()
    const path = parsed.pathname.toLowerCase()

    if (/\.(mp4|m4v)(\?.*)?$/.test(path) || cleanUrl.toLowerCase().includes('.mp4')) {
      return cleanUrl
    }

    if (/\.(jpe?g|png|webp|gif)(\?.*)?$/.test(path) || cleanUrl.toLowerCase().includes('.jpg') || cleanUrl.toLowerCase().includes('.jpeg') || cleanUrl.toLowerCase().includes('.png') || cleanUrl.toLowerCase().includes('.webp') || cleanUrl.toLowerCase().includes('.gif')) {
      return cleanUrl
    }
  } catch {
    return null
  }

  return null
}

const resolveMediaFromUrl = async (value) => {
  const directMedia = getDirectMediaUrl(value)
  if (directMedia) {
    return directMedia
  }

  try {
    const parsed = new URL(value)
    const candidates = [
      parsed.toString(),
      `https://r.jina.ai/http://${parsed.host}${parsed.pathname}${parsed.search}`,
      `https://r.jina.ai/http://https://${parsed.host}${parsed.pathname}${parsed.search}`,
    ]

    const seen = new Set()

    for (const candidate of candidates) {
      if (seen.has(candidate)) {
        continue
      }
      seen.add(candidate)

      try {
        const response = await fetch(candidate, {
          headers: {
            Accept: 'text/html, text/plain, text/markdown, application/json',
          },
        })

        if (!response.ok) {
          continue
        }

        const text = await response.text()
        const directMatches = [
          ...(text.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif|mp4)(?:\?[^\s"'<>]*)?/gi) || []),
          ...(text.matchAll(/(?:og:image|twitter:image|twitter:player|og:video)\s*[:=]\s*["']?([^\s"'<>]+)["']?/gi) || []),
        ]

        for (const match of directMatches) {
          const extractedUrl = (match[1] || match[0] || '').trim().replace(/^['"]|['"]$/g, '')
          if (extractedUrl && extractedUrl.startsWith('http')) {
            const resolved = getDirectMediaUrl(extractedUrl)
            if (resolved) {
              return resolved
            }
          }
        }
      } catch {
        continue
      }
    }
  } catch {
    return null
  }

  return null
}

export function CreateNewsPage({ initialArticle = null, onSaved, onCancel }) {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const headlineEditorRef = useRef(null)
  const headlineQuillRef = useRef(null)

  const [headline, setHeadline] = useState(() => normalizeHeadlineRichText(initialArticle?.title || ''))
  const [content, setContent] = useState(initialArticle?.content || '')
  const [language, setLanguage] = useState(initialArticle?.language || (detectPunjabiLanguage(initialArticle?.title || '') === 'punjabi' ? 'punjabi' : 'hindi'))
  const [isBreaking, setIsBreaking] = useState(Boolean(initialArticle?.is_breaking))
  const [isFeatured, setIsFeatured] = useState(Boolean(initialArticle?.is_featured))
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaUrl, setMediaUrl] = useState(initialArticle?.video_url || initialArticle?.image_url || '')
  const [mediaType, setMediaType] = useState(() => {
    const existingMedia = initialArticle?.video_url || initialArticle?.image_url || ''
    return getMediaTypeFromUrl(existingMedia) || (isVideoAsset(existingMedia) ? 'video' : 'image')
  })
  const [imagePreview, setImagePreview] = useState(initialArticle?.video_url || initialArticle?.image_url || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const cleanTitle = normalizeHeadlineRichText(initialArticle?.title || '')
    setHeadline(cleanTitle)
    setContent(initialArticle?.content || '')
    setLanguage(initialArticle?.language || (detectPunjabiLanguage(initialArticle?.title || '') === 'punjabi' ? 'punjabi' : 'hindi'))
    setIsBreaking(Boolean(initialArticle?.is_breaking))
    setIsFeatured(Boolean(initialArticle?.is_featured))
    const existingMedia = initialArticle?.video_url || initialArticle?.image_url || ''
    setMediaUrl(existingMedia)
    setMediaType(getMediaTypeFromUrl(existingMedia) || (isVideoAsset(existingMedia) ? 'video' : 'image'))
    setImagePreview(existingMedia)
    setMediaFile(null)
    setError('')
    setSuccess('')
  }, [initialArticle])

  useEffect(() => {
    if (!headlineEditorRef.current || headlineQuillRef.current) {
      return
    }

    const quill = new Quill(headlineEditorRef.current, {
      theme: 'snow',
      formats: [
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'color',
        'background',
        'align',
        'clean',
      ],
      modules: {
        toolbar: [
          [{ font: [] }, { size: ['small', false, 'large', 'huge'] }, { align: [] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          ['undo', 'redo', 'clean'],
        ],
        history: {
          delay: 500,
          maxStack: 100,
          userOnly: true,
        },
      },
      placeholder: 'Enter the headline (Max 300 characters)',
    })

    headlineQuillRef.current = quill

    quill.on('text-change', () => {
      setHeadline(normalizeHeadlineRichText(quill.root.innerHTML))
    })

    const initialHeadline = normalizeHeadlineRichText(initialArticle?.title || headline || '')
    if (initialHeadline) {
      quill.clipboard.dangerouslyPasteHTML(initialHeadline)
    }

    return () => {
      quill.off('text-change')
      headlineQuillRef.current = null
      if (headlineEditorRef.current) {
        headlineEditorRef.current.innerHTML = ''
      }
    }
  }, [])

  useEffect(() => {
    if (headlineQuillRef.current) {
      const nextHeadline = normalizeHeadlineRichText(initialArticle?.title || '')
      const currentHeadline = normalizeHeadlineRichText(headlineQuillRef.current.root.innerHTML)

      if (currentHeadline !== nextHeadline) {
        headlineQuillRef.current.clipboard.dangerouslyPasteHTML(nextHeadline || '<p></p>')
        setHeadline(nextHeadline)
      }
    }
  }, [initialArticle])

  // Content Quill Editor Initialization
  useEffect(() => {
    if (!editorRef.current || quillRef.current) {
      return
    }

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      formats: [
        'header',
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'indent',
        'link',
        'color',
        'background',
        'align',
      ],
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          [{ font: [] }, { size: ['small', false, 'large', 'huge'] }, { align: [] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['blockquote', 'link'],
          ['clean'],
        ],
      },
      placeholder: 'Write the full story here...'
    })

    quillRef.current = quill

    quill.on('text-change', () => {
      setContent(normalizeRichTextContent(quill.root.innerHTML))
    })

    if (content) {
      quill.clipboard.dangerouslyPasteHTML(normalizeRichTextContent(content) || '<p></p>')
    }

    return () => {
      quill.off('text-change')
      quillRef.current = null
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
    }
  }, [])

  useEffect(() => {
    const quill = quillRef.current
    if (quill) {
      const nextContent = normalizeRichTextContent(initialArticle?.content || '')
      const currentContent = normalizeRichTextContent(quill.root.innerHTML)
      if (currentContent !== nextContent) {
        quill.clipboard.dangerouslyPasteHTML(nextContent || '<p></p>')
        setContent(nextContent)
      }
    }
  }, [initialArticle])

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage)

    const nextHeadline = normalizeHeadlineRichText(
      nextLanguage === 'punjabi'
        ? transliterateHtmlToPunjabi(headline)
        : transliteratePunjabiToHindi(headline)
    )

    const nextContent = normalizeRichTextContent(
      nextLanguage === 'punjabi'
        ? transliterateHtmlToPunjabi(content)
        : transliteratePunjabiToHindi(content)
    )

    setHeadline(nextHeadline)
    setContent(nextContent)

    if (headlineQuillRef.current) {
      headlineQuillRef.current.clipboard.dangerouslyPasteHTML(nextHeadline || '<p></p>')
    }

    if (quillRef.current) {
      quillRef.current.clipboard.dangerouslyPasteHTML(nextContent || '<p></p>')
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const fileType = (file.type || '').toLowerCase()
    const fileName = (file.name || '').toLowerCase()
    const isVideo = fileType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.m4v')
    const normalizedType = fileType || (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' : fileName.endsWith('.png') ? 'image/png' : fileName.endsWith('.webp') ? 'image/webp' : fileName.endsWith('.mp4') ? 'video/mp4' : '')
    const allowed = isVideo ? ['video/mp4'] : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowed.includes(normalizedType)) {
      setError(isVideo ? 'Only MP4 videos are supported.' : 'Only JPG, JPEG, PNG, and WEBP images are supported.')
      return
    }

    const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError(isVideo ? 'Video must be smaller than 25 MB.' : 'Image must be smaller than 5 MB.')
      return
    }

    setError('')
    setMediaFile(file)
    setMediaUrl('')
    setMediaType(isVideo ? 'video' : 'image')
    setImagePreview(URL.createObjectURL(file))
  }

  const handleMediaUrlChange = async (event) => {
    const nextValue = event.target.value.trim()
    setMediaUrl(nextValue)

    if (!nextValue) {
      setMediaFile(null)
      setMediaType('image')
      setImagePreview('')
      setError('')
      return
    }

    try {
      const parsedUrl = new URL(nextValue)
      const isAllowedHttp = ['http:', 'https:'].includes(parsedUrl.protocol)
      if (!isAllowedHttp) {
        setError('Please paste a valid public http or https media URL.')
        return
      }

      const directMedia = getDirectMediaUrl(nextValue)
      if (directMedia) {
        setMediaType(getMediaTypeFromUrl(directMedia) || 'image')
        setError('')
        setMediaFile(null)
        setImagePreview(directMedia)
        return
      }

      setError('Checking this article link for a main image or video...')
      const resolvedMedia = await resolveMediaFromUrl(nextValue)

      if (resolvedMedia) {
        setMediaType(getMediaTypeFromUrl(resolvedMedia) || 'image')
        setError('')
        setMediaFile(null)
        setImagePreview(resolvedMedia)
        return
      }

      setError('Please paste a direct image or MP4 URL. If it is an article page, the app will try to detect the main media automatically.')
    } catch {
      setError('Please enter a valid URL for an image or MP4 video.')
    }
  }

  const resetForm = () => {
    setHeadline('')
    setContent('')
    setLanguage('hindi')
    setIsBreaking(false)
    setIsFeatured(false)
    setMediaFile(null)
    setMediaUrl('')
    setMediaType('image')
    setImagePreview('')
    setError('')
    setSuccess('')
    if (headlineQuillRef.current) {
      headlineQuillRef.current.root.innerHTML = ''
    }
    if (quillRef.current) {
      quillRef.current.root.innerHTML = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const headlineHtml = normalizeHeadlineRichText(headline)
    const cleanHeadline = normalizePlainTextContent(headlineHtml).trim().slice(0, 300)
    if (!cleanHeadline) {
      setError('Please enter headline.')
      return
    }

    const richContent = quillRef.current ? quillRef.current.root.innerHTML : content
    const sanitizedContent = normalizePlainTextContent(richContent || content)
    const plainTextContent = sanitizedContent.trim()
    if (!plainTextContent) {
      setError('News content is required.')
      return
    }

    const finalHtmlContent = normalizeRichTextContent(richContent || content)

    const mediaUrlToSave = mediaFile ? await uploadNewsMedia(mediaFile) : mediaUrl || initialArticle?.video_url || initialArticle?.image_url

    if (!mediaUrlToSave) {
      setError('Please select a cover image or MP4 video, or paste a direct media URL before publishing.')
      return
    }

    try {
      if (initialArticle?.id) {
        setIsSaving(true)
        await updateNewsArticle({
          id: initialArticle.id,
          title: headlineHtml,
          content: finalHtmlContent,
          imageUrl: mediaUrlToSave,
          isBreaking,
          isFeatured,
          language,
        })
        setSuccess('News updated successfully.')
      } else {
        setIsUploading(true)
        const finalMediaUrl = mediaFile ? await uploadNewsMedia(mediaFile) : mediaUrl || initialArticle?.video_url || initialArticle?.image_url
        setIsUploading(false)
        setIsSaving(true)

        await publishNewsArticle({
          title: headlineHtml,
          content: finalHtmlContent,
          imageUrl: finalMediaUrl,
          isBreaking,
          isFeatured,
          language,
        })

        setSuccess('News published successfully.')
      }

      resetForm()
      window.setTimeout(() => {
        onSaved()
      }, 900)
    } catch (submitError) {
      setError(submitError.message || 'The article could not be published.')
    } finally {
      setIsUploading(false)
      setIsSaving(false)
    }
  }

  return (
    <div className="page-shell form-page">
      <header className="topbar topbar--stacked">
        <div>
          <p className="eyebrow">Editor workspace</p>
          <h1>{initialArticle ? 'Edit News' : 'Create News'}</h1>
        </div>
        <button type="button" className="ghost-button" onClick={onCancel}>
          Back to dashboard
        </button>
      </header>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="image-upload">Upload media file</label>
          <input
            id="image-upload"
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleImageChange}
          />

          <div className="field-subtext">Or paste a direct public image/video URL below.</div>
          <input
            type="url"
            value={mediaUrl}
            onChange={handleMediaUrlChange}
            placeholder="https://example.com/image.jpg or https://example.com/video.mp4"
            className="media-url-input"
          />

          {imagePreview ? (
            <div className="image-preview-wrap">
              {mediaType === 'video' ? (
                <video src={imagePreview} controls className="image-preview video-preview" />
              ) : (
                <img src={imagePreview} alt="Selected news cover" className="image-preview" />
              )}
            </div>
          ) : (
            <div className="image-placeholder">Upload a JPG, JPEG, PNG, WEBP image or MP4 video, or paste a direct media URL</div>
          )}
        </div>

        <div className="field-group">
          <label>Language</label>
          <div className="language-toggle" aria-label="News language selector">
            <button
              type="button"
              className={language === 'hindi' ? 'language-option is-selected' : 'language-option'}
              onClick={() => handleLanguageChange('hindi')}
            >
              Hindi
            </button>
            <button
              type="button"
              className={language === 'punjabi' ? 'language-option is-selected' : 'language-option'}
              onClick={() => handleLanguageChange('punjabi')}
            >
              Punjabi
            </button>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="headline">Headline (rich text)</label>
          <div className="content-editor headline-editor">
            <div ref={headlineEditorRef} id="headline" className="quill-editor" aria-label="Headline editor" />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="content">News content</label>
          <div className="content-editor">
            <div ref={editorRef} className="quill-editor" aria-label="News content editor" />
          </div>
        </div>

        <div className="checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(event) => setIsBreaking(event.target.checked)}
            />
            Breaking News
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
            />
            Featured
          </label>
        </div>

        {error && <p className="form-message form-message--error">{error}</p>}
        {success && <p className="form-message form-message--success">{success}</p>}

        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={isUploading || isSaving}>
            {isUploading ? 'Uploading image...' : isSaving ? (initialArticle ? 'Saving...' : 'Publishing...') : (initialArticle ? 'Save changes' : 'Publish')}
          </button>
        </div>
      </form>
    </div>
  )
}
