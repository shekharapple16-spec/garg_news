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

export function NewsCard({ item, onEdit, onTogglePublish, onDelete }) {
  return (
    <article className="news-card">
      <img
        className="news-card__image"
        src={item.image_url || 'https://images.unsplash.com/...'}
        alt={item.title || 'News headline'}
        onError={(event) => {
          event.currentTarget.src = 'https://placehold.co/800x600/111827/ffffff?text=Garg+News'
        }}
      />

      <div className="news-card__body">
        <div className="news-card__meta">
          <span>{formatDate(item.published_at || item.created_at)}</span>
          {item.is_breaking && <span className="badge badge--danger">Breaking</span>}
          {item.is_featured && <span className="badge badge--gold">Featured</span>}
        </div>

        <h3>{item.title}</h3>
      </div>
    </article>
  )
}
