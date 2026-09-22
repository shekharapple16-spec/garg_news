import { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import {
  detectPunjabiLanguage,
  normalizePlainTextContent,
  normalizeRichTextContent,
  transliterateHindiToPunjabi,
  transliterateHtmlToPunjabi,
  transliteratePunjabiToHindi,
} from '../lib/translation'
import { uploadNewsImage, publishNewsArticle, updateNewsArticle } from '../services/newsService'

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/webp'

export function CreateNewsPage({ initialArticle = null, onSaved, onCancel }) {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const [headline, setHeadline] = useState(initialArticle?.title || '')
  const [content, setContent] = useState(initialArticle?.content || '')
  const [language, setLanguage] = useState(initialArticle?.language || (detectPunjabiLanguage(initialArticle?.title || '') === 'punjabi' ? 'punjabi' : 'hindi'))
  const [isBreaking, setIsBreaking] = useState(Boolean(initialArticle?.is_breaking))
  const [isFeatured, setIsFeatured] = useState(Boolean(initialArticle?.is_featured))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(initialArticle?.image_url || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setHeadline(initialArticle?.title || '')
    setContent(initialArticle?.content || '')
    setLanguage(initialArticle?.language || (detectPunjabiLanguage(initialArticle?.title || '') === 'punjabi' ? 'punjabi' : 'hindi'))
    setIsBreaking(Boolean(initialArticle?.is_breaking))
    setIsFeatured(Boolean(initialArticle?.is_featured))
    setImagePreview(initialArticle?.image_url || '')
    setImageFile(null)
    setError('')
    setSuccess('')
  }, [initialArticle])

  useEffect(() => {
    if (!editorRef.current || quillRef.current) {
      return
    }

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      formats: [
        'header',
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
      ],
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
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
    if (!quill) {
      return
    }

    const nextContent = normalizeRichTextContent(initialArticle?.content || '')
    const currentContent = normalizeRichTextContent(quill.root.innerHTML)

    if (currentContent !== nextContent) {
      quill.clipboard.dangerouslyPasteHTML(nextContent || '<p></p>')
      setContent(nextContent)
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

    const nextHeadline = nextLanguage === 'punjabi'
      ? transliterateHindiToPunjabi(headline)
      : transliteratePunjabiToHindi(headline)

    const nextContent = normalizeRichTextContent(
      nextLanguage === 'punjabi'
        ? transliterateHtmlToPunjabi(content)
        : transliteratePunjabiToHindi(content)
    )

    setHeadline(nextHeadline)
    setContent(nextContent)

    if (quillRef.current) {
      quillRef.current.clipboard.dangerouslyPasteHTML(nextContent || '<p></p>')
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const fileType = file.type.toLowerCase()
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowed.includes(fileType)) {
      setError('Only JPG, JPEG, PNG, and WEBP images are supported.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.')
      return
    }

    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setHeadline('')
    setContent('')
    setLanguage('hindi')
    setIsBreaking(false)
    setIsFeatured(false)
    setImageFile(null)
    setImagePreview('')
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!headline.trim()) {
      setError('Headline is required.')
      return
    }

    const richContent = normalizeRichTextContent(content)
    const sanitizedContent = normalizePlainTextContent(richContent || content)
    const plainTextContent = sanitizedContent.trim()
    if (!plainTextContent) {
      setError('News content is required.')
      return
    }

    setContent(sanitizedContent)

    const imageUrlToSave = imageFile ? await uploadNewsImage(imageFile) : initialArticle?.image_url

    if (!imageUrlToSave) {
      setError('Please select a cover image before publishing.')
      return
    }

    try {
      if (initialArticle?.id) {
        setIsSaving(true)
        await updateNewsArticle({
          id: initialArticle.id,
          title: headline,
          content: sanitizedContent,
          imageUrl: imageUrlToSave,
          isBreaking,
          isFeatured,
          language,
        })
        setSuccess('News updated successfully.')
      } else {
        setIsUploading(true)
        const imageUrl = await uploadNewsImage(imageFile)
        setIsUploading(false)
        setIsSaving(true)

        await publishNewsArticle({
          title: headline,
          content: sanitizedContent,
          imageUrl,
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
          <label htmlFor="image-upload">News image</label>
          <input
            id="image-upload"
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleImageChange}
          />

          {imagePreview ? (
            <div className="image-preview-wrap">
              <img src={imagePreview} alt="Selected news cover" className="image-preview" />
            </div>
          ) : (
            <div className="image-placeholder">Upload a JPG, JPEG, PNG, or WEBP image</div>
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
          <label htmlFor="headline">Headline</label>
          <input
            id="headline"
            type="text"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="Enter the headline"
            maxLength={180}
          />
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
