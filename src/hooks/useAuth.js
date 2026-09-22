import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentSession } from '../services/authService'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const currentSession = await getCurrentSession()
        if (isMounted) {
          setSession(currentSession)
        }
      } catch (error) {
        if (isMounted) {
          setSession(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
