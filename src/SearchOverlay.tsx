import { createPortal } from 'react-dom'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHomeCatalog } from './hooks'
import { MediaGrid } from './ui'
import { mediaTypeFromItem } from './lib/tmdb'

// ─── SearchOverlay (portal-mounted so it always sits above everything) ────────

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const homeState = useHomeCatalog(query)
  const results = query.trim().length >= 2 ? homeState.searchResults : homeState.recommendations
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all')

  const filteredResults = filter === 'all' ? results : results.filter(r => mediaTypeFromItem(r) === filter)

  const overlay = (
    <AnimatePresence>
      <motion.div
        key="search-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        // Full-screen fixed, above everything (z-[200] beats nav z-50)
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(8,8,8,0.97)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        // Click backdrop to close
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* ── Search bar ────────────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '20px 28px',
              maxWidth: '1536px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <Search style={{ width: 20, height: 20, color: 'var(--accent)', flexShrink: 0 }} />
            <input
              id="search-input"
              autoFocus
              value={query}
              onChange={(e) => {
                const nextParams = new URLSearchParams(searchParams)
                if (e.target.value.trim()) nextParams.set('q', e.target.value)
                else nextParams.delete('q')
                setSearchParams(nextParams, { replace: true })
              }}
              placeholder="Search movies and shows…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 22,
                fontWeight: 400,
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                minWidth: 0,
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                flexShrink: 0,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex gap-2 px-7 pb-4 max-w-[1536px] mx-auto w-full"
          >
            {(['all', 'movie', 'tv'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{
                  background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                  color: filter === f ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`
                }}
              >
                {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Shows'}
              </button>
            ))}
          </motion.div>
        </div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <div style={{ maxWidth: '1536px', margin: '0 auto' }}>
            {query.trim().length >= 2 ? (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 16 }}>
                {homeState.loading ? 'Searching…' : `${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''} for "${query}"`}
              </p>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 16 }}>
                Trending right now
              </p>
            )}
            <MediaGrid
              items={filteredResults}
              loading={homeState.loading && results.length === 0}
              emptyLabel="No results. Try a different filter."
              columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              stagger
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(overlay, document.body)
}

// ─── HomeSearchToggle ─────────────────────────────────────────────────────────

export function HomeSearchToggle() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search…</span>
      </button>
      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  )
}
