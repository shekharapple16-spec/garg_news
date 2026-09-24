import { detectPunjabiLanguage, normalizePlainTextContent } from '../lib/translation'

const formatDate = (value) => {
  if (!value) return 'Just now'

  try {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Recently'
    }

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return 'Recently'
  }
}

const isVideoAsset = (value) => {
  if (typeof value !== 'string') {
    return false
  }

  const normalized = value.toLowerCase()
  return normalized.endsWith('.mp4') || normalized.includes('/video/') || normalized.includes('video')
}

export function NewsCard({ item, onEdit, onTogglePublish, onDelete }) {
  const mediaUrl = item.video_url || item.image_url
  const isVideo = isVideoAsset(mediaUrl)

  return (
    <article className="news-card">
      {isVideo ? (
        <video className="news-card__image" src={mediaUrl} controls playsInline muted />
      ) : (
        <img
          className="news-card__image"
          src={mediaUrl || 'https://images.unsplash.com/...'}
          alt={normalizePlainTextContent(item.title || 'News headline') || 'News headline'}
          onError={(event) => {
            event.currentTarget.src = 'https://placehold.co/800x600/111827/ffffff?text=Garg+News'
          }}
        />
      )}

      <div className="news-card__body">
        <div className="news-card__meta">
          <span>{formatDate(item.published_at || item.created_at)}</span>
          <span className="badge badge--neutral">{item.language === 'punjabi' || detectPunjabiLanguage(item.title) === 'punjabi' ? 'Punjabi' : 'Hindi'}</span>
          {item.is_breaking && <span className="badge badge--danger">Breaking</span>}
          {item.is_featured && <span className="badge badge--gold">Featured</span>}
        </div>

        <h3 dangerouslySetInnerHTML={{ __html: item.title || '' }} />
      </div>
    </article>
  )
}
