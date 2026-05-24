import { useEffect, useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchPersonDetails, imageUrl, hasTmdbCredentials } from './lib/tmdb'
import type { PersonDetails, MediaItem } from './types'
import { SetupNotice, MediaGrid, FactBadge } from './ui'

export function CastPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [details, setDetails] = useState<PersonDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    
    fetchPersonDetails(id, controller.signal)
      .then(res => {
        if (!controller.signal.aborted) {
          setDetails(res)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load person details.')
          setLoading(false)
        }
      })
      
    return () => controller.abort()
  }, [id])

  if (!hasTmdbCredentials) return <div className="px-6 pt-24 max-w-3xl mx-auto"><SetupNotice /></div>
  if (!id) return <Navigate replace to="/" />

  const credits = details?.combined_credits?.cast ?? []
  // Sort credits by vote count (popularity proxy)
  const sortedCredits = credits.slice().sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))

  return (
    <div className="mx-auto max-w-screen-2xl px-6 pb-16 pt-24">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse text-white/50">Loading profile...</div>
      ) : error ? (
        <SetupNotice compact message={error} />
      ) : details ? (
        <div className="grid gap-12 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr]">
          {/* Sidebar */}
          <div>
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.05)', aspectRatio: '2/3' }}>
              {details.profile_path ? (
                <img
                  src={imageUrl(details.profile_path, 'w500')}
                  alt={details.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {details.name.charAt(0)}
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-4">Personal Info</h2>
            <div className="grid gap-2">
              <FactBadge label="Known For" value={details.known_for_department ?? '—'} />
              <FactBadge label="Born" value={details.birthday ?? '—'} />
              {details.deathday && <FactBadge label="Died" value={details.deathday} />}
              <FactBadge label="Place of Birth" value={details.place_of_birth ?? '—'} />
            </div>
          </div>

          {/* Main Content */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {details.name}
            </h1>
            
            {details.biography && (
              <div className="mb-12">
                <h2 className="text-lg font-semibold text-white mb-3">Biography</h2>
                <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {details.biography}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Known For</h2>
              <MediaGrid
                items={sortedCredits}
                loading={false}
                emptyLabel="No credits found."
                columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
