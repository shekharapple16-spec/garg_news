import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import { signInWithEmail, signOutUser, signUpWithEmail } from './services/authService'
import {
  fetchPublishedNews,
  updateNewsStatus,
  deleteNewsArticle,
} from './services/newsService'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PublishedNewsPage } from './pages/PublishedNewsPage'
import { CreateNewsPage } from './pages/CreateNewsPage'

function App() {
  const [session, setSession] = useState(null)
  const [authError, setAuthError] = useState('')
  const [news, setNews] = useState([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [view, setView] = useState('dashboard')
  const [editingArticle, setEditingArticle] = useState(null)

  const refreshNews = async () => {
    try {
      setLoadingNews(true)
      const articles = await fetchPublishedNews()
      setNews(articles)
    } catch (error) {
      setNews([])
    } finally {
      setLoadingNews(false)
    }
  }

  const handleTogglePublish = async (article) => {
    try {
      const updatedArticle = await updateNewsStatus({
        id: article.id,
        status: article.status === 'published' ? 'draft' : 'published',
      })

      if (updatedArticle) {
        setNews((currentNews) =>
          currentNews
            .map((item) => (item.id === updatedArticle.id ? updatedArticle : item))
            .filter((item) => item.status === 'published')
        )
      }

      await refreshNews()
    } catch (error) {
      setAuthError(error.message || 'Unable to update article status.')
    }
  }

  const handleDeleteNews = async (id) => {
    try {
      await deleteNewsArticle(id)
      await refreshNews()
    } catch (error) {
      setAuthError(error.message || 'Unable to delete article.')
    }
  }

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setIsAuthLoading(false)
      setView(data.session ? 'dashboard' : 'login')
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setIsAuthLoading(false)

      setView((currentView) => {
        if (!nextSession) {
          return 'login'
        }

        if (currentView === 'create') {
          return currentView
        }

        if (currentView === 'login' || event === 'SIGNED_IN') {
          return 'dashboard'
        }

        return currentView
      })

      if (nextSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        refreshNews()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      refreshNews()
    }
  }, [session])

  const handleLogin = async ({ email, password }) => {
    setAuthError('')
    setIsAuthLoading(true)

    try {
      await signInWithEmail(email, password)
    } catch (error) {
      setAuthError(error.message || 'Unable to login right now.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleSignup = async ({ username, mobile, email, password }) => {
    setAuthError('')
    setIsAuthLoading(true)

    try {
      const result = await signUpWithEmail({ username, mobile, email, password })

      if (result?.session) {
        setView('dashboard')
        return
      }

      setView('login')
      setAuthError('Account created successfully. Please check your email to confirm and then sign in.')
    } catch (error) {
      setAuthError(error.message || 'Unable to create account right now.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOutUser()
      setView('login')
      setNews([])
    } catch (error) {
      setAuthError(error.message || 'Unable to logout right now.')
    }
  }

  if (isAuthLoading && !session) {
    return (
      <div className="page-shell loading-shell">
        <div className="loading-box">Checking session...</div>
      </div>
    )
  }

  if (!session && (view === 'login' || view === 'signup')) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        error={authError}
        loading={isAuthLoading}
        mode={view}
        onSwitchMode={() => {
          setAuthError('')
          setView((currentView) => (currentView === 'login' ? 'signup' : 'login'))
        }}
      />
    )
  }

  if (session && view === 'dashboard') {
    return (
      <DashboardPage
        news={news}
        loading={loadingNews}
        onCreateNews={() => {
          setEditingArticle(null)
          setView('create')
        }}
        onOpenPublishedList={() => setView('published')}
        onEditNews={(item) => {
          setEditingArticle(item)
          setView('create')
        }}
        onTogglePublish={handleTogglePublish}
        onDeleteNews={handleDeleteNews}
        onLogout={handleLogout}
      />
    )
  }

  if (session && view === 'published') {
    return (
      <PublishedNewsPage
        news={news}
        loading={loadingNews}
        onBack={() => setView('dashboard')}
        onCreateNews={() => {
          setEditingArticle(null)
          setView('create')
        }}
        onEditNews={(item) => {
          setEditingArticle(item)
          setView('create')
        }}
        onTogglePublish={handleTogglePublish}
        onDeleteNews={handleDeleteNews}
      />
    )
  }

  if (session && view === 'create') {
    return (
      <CreateNewsPage
        initialArticle={editingArticle}
        onSaved={() => {
          setEditingArticle(null)
          setView('dashboard')
          refreshNews()
        }}
        onCancel={() => {
          setEditingArticle(null)
          setView('dashboard')
        }}
      />
    )
  }

  return null
}

export default App
