import { detectPunjabiLanguage } from '../lib/translation'

const formatDate = (value) => {
  if (!value) return 'No date'

  try {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Recently'
    }

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return 'Recently'
  }
}

export function PublishedNewsPage({
  news,
  loading,
  onBack,
  onCreateNews,
  onEditNews,
  onTogglePublish,
  onDeleteNews,
}) {
  return (
    <div className="page-shell dashboard-page">
      <header className="topbar topbar--stacked">
        <div>
          <p className="eyebrow">Published items</p>
          <h1>All published stories</h1>
        </div>

        <div className="topbar__actions">
          <button type="button" className="secondary-button" onClick={onCreateNews}>
            Create News
          </button>
          <button type="button" className="ghost-button" onClick={onBack}>
            Back to dashboard
          </button>
        </div>
      </header>

      <section className="panel table-panel">
        {loading ? (
          <div className="empty-state">
            <p>Loading published stories...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="empty-state">
            <p>No published stories available right now.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="news-table">
              <thead>
                <tr>
                  <th>Headline</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="news-table__headline">
                        <img src={item.image_url} alt={item.title} className="news-table__thumb" />
                        <div className="news-table__headline-text">
                          <strong>{item.title}</strong>
                          <small>
                            {(item.language === 'punjabi' || detectPunjabiLanguage(item.title) === 'punjabi') ? 'Punjabi' : 'Hindi'} • {' '}
                            {item.is_breaking ? 'Breaking' : 'Regular'} • {item.is_featured ? 'Featured' : 'Standard'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status === 'published' ? 'status-badge--published' : 'status-badge--draft'}`}>
                        {item.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>{formatDate(item.published_at || item.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="ghost-button row-button" onClick={() => onEditNews?.(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-button row-button"
                          onClick={() => onTogglePublish?.(item)}
                        >
                          Unpublish
                        </button>
                        <button
                          type="button"
                          className="ghost-button row-button row-button--danger"
                          onClick={() => onDeleteNews?.(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
