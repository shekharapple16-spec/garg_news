import { motion } from 'framer-motion'
import { BrandLogo } from '../components/BrandLogo'
import { NewsCard } from '../components/NewsCard'

export function DashboardPage({
  news,
  loading,
  onCreateNews,
  onOpenPublishedList,
  onEditNews,
  onTogglePublish,
  onDeleteNews,
  onLogout,
}) {
  return (
    <motion.div
      className="page-shell dashboard-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="cms-shell">
        <motion.aside
          className="cms-sidebar"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        >
          <div className="cms-brand">
            <BrandLogo className="cms-brand__mark" size={48} alt="Garg News logo" />
            <div>
              <p className="eyebrow">Admin</p>
              <h2>Garg News</h2>
            </div>
          </div>

          <nav className="cms-nav" aria-label="Sidebar navigation">
            <button type="button" className="cms-nav__item is-active">
              Overview
            </button>
            <button type="button" className="cms-nav__item" onClick={onOpenPublishedList}>
              Published List
            </button>
            <button type="button" className="cms-nav__item" onClick={onCreateNews}>
              Create News
            </button>
          </nav>

          <div className="cms-sidebar__footer">
            <button type="button" className="ghost-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </motion.aside>

        <main className="cms-main">
          <motion.header
            className="topbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div>
              <p className="eyebrow">News Admin</p>
              <h1>Garg News Channel</h1>
              <p className="muted-text">Ferozepur, Punjab</p>
            </div>

            <div className="topbar__actions">
              <button type="button" className="secondary-button" onClick={onOpenPublishedList}>
                Published List
              </button>
              <button type="button" className="secondary-button" onClick={onCreateNews}>
                Create News
              </button>
            </div>
          </motion.header>

          <motion.section
            className="panel dashboard-welcome"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
          >
            <div className="dashboard-welcome__content">
              <p className="eyebrow">Live newsroom</p>
              <h2>Keep the region informed, one update at a time.</h2>
              <p className="dashboard-welcome__text">
                Publish breaking local stories, feature standout coverage, and stay on top of what matters most to Ferozepur.
              </p>
              <div className="dashboard-welcome__stats">
                <div>
                  <strong>{news.length}</strong>
                  <span>Published</span>
                </div>
                <div>
                  <strong>{news.filter((item) => item.is_breaking).length}</strong>
                  <span>Breaking</span>
                </div>
                <div>
                  <strong>{news.filter((item) => item.is_featured).length}</strong>
                  <span>Featured</span>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.12 }}
          >
            <div className="section-heading">
              <h2>Latest updates</h2>
            </div>

            {loading ? (
              <div className="empty-state">
                <p>Loading newsroom updates...</p>
              </div>
            ) : news.length === 0 ? (
              <div className="empty-state">
                <p>No stories published yet. Start with your first regional update.</p>
              </div>
            ) : (
              <div className="news-grid">
                {news.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    onEdit={onEditNews}
                    onTogglePublish={onTogglePublish}
                    onDelete={onDeleteNews}
                  />
                ))}
              </div>
            )}
          </motion.section>
        </main>
      </div>
    </motion.div>
  )
}
