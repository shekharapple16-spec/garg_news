import { useEffect, useState } from 'react'
import { uploadNewsImage, publishNewsArticle, updateNewsArticle } from '../services/newsService'

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/webp'

export function CreateNewsPage({ initialArticle = null, onSaved, onCancel }) {
  const [headline, setHeadline] = useState(initialArticle?.title || '')
  const [content, setContent] = useState(initialArticle?.content || '')
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
    setIsBreaking(Boolean(initialArticle?.is_breaking))
    setIsFeatured(Boolean(initialArticle?.is_featured))
    setImagePreview(initialArticle?.image_url || '')
    setImageFile(null)
    setError('')
    setSuccess('')
  }, [initialArticle])

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

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

    if (!content.trim()) {
      setError('News content is required.')
      return
    }

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
          content,
          imageUrl: imageUrlToSave,
          isBreaking,
          isFeatured,
        })
        setSuccess('News updated successfully.')
      } else {
        setIsUploading(true)
        const imageUrl = await uploadNewsImage(imageFile)
        setIsUploading(false)
        setIsSaving(true)

        await publishNewsArticle({
          title: headline,
          content,
          imageUrl,
          isBreaking,
          isFeatured,
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
          <textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write the full story here..."
            rows={10}
          />
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
