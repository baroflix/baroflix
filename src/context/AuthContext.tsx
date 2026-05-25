import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Profile } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  /** The raw Supabase session (null when signed out) */
  session: Session | null
  /** Resolved profile row for the current user */
  profile: Profile | null
  /** True while the initial session is being resolved */
  loading: boolean
  /** Sign in with email + password */
  signInWithEmail: (email: string, password: string) => Promise<void>
  /** Sign in via Google OAuth (redirects) */
  signInWithGoogle: () => Promise<void>
  /** Sign out the current user */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ─────────────────────────────────────────────────────────────
// Helper: verify email is in the allowlist
// ─────────────────────────────────────────────────────────────
async function assertEmailAllowed(email: string): Promise<void> {
  const { data, error } = await supabase
    .from('allowed_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw new Error(`Allowlist check failed: ${error.message}`)
  }

  if (!data) {
    // Force sign-out before throwing so no partial session remains
    await supabase.auth.signOut()
    throw new Error(
      'Access Denied: Your account is not on the authorized access list.'
    )
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: fetch profile row
// ─────────────────────────────────────────────────────────────
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, updated_at')
    .eq('id', userId)
    .maybeSingle()

  return data ?? null
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Called every time auth state changes (sign-in, sign-out, token refresh)
  const handleSession = useCallback(async (newSession: Session | null) => {
    if (!newSession) {
      setSession(null)
      setProfile(null)
      return
    }

    try {
      await assertEmailAllowed(newSession.user.email ?? '')
      const prof = await fetchProfile(newSession.user.id)
      setSession(newSession)
      setProfile(prof)
    } catch (err) {
      // assertEmailAllowed already called signOut; just clear state
      setSession(null)
      setProfile(null)
      throw err // re-throw so sign-in functions can surface the error
    }
  }, [])

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session).finally(() => setLoading(false))
    })

    // Subscribe to future changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        handleSession(newSession).catch(() => {
          /* errors surfaced via signIn functions */
        })
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [handleSession])

  // ── Public API ────────────────────────────────────────────
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw new Error(error.message)
      // handleSession is called by onAuthStateChange, but we also
      // call it here to surface allowlist errors immediately.
      await handleSession(data.session)
    },
    [handleSession]
  )

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
    if (error) throw new Error(error.message)
    // Allowlist check happens in onAuthStateChange after redirect
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signInWithEmail, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
