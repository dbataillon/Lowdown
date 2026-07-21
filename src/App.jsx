import { useRef, useState } from 'react'
import './App.css'
import AlbumCard from './Components/AlbumCard'
import Header from './Components/Header'
import SearchForm from './Components/SearchForm'
import { searchAlbums } from './services/musicBrainz'

const recentPlaceholders = [
  {
    id: 'recent-1',
    title: 'Golden Hour',
    artist: 'The Daybreaks',
    year: '1977',
    coverClass: 'cover-rust',
  },
  {
    id: 'recent-2',
    title: 'After Midnight',
    artist: 'Velvet Avenue',
    year: '1979',
    coverClass: 'cover-olive',
  },
  {
    id: 'recent-3',
    title: 'Open Road',
    artist: 'The Wandering Lines',
    year: '1975',
    coverClass: 'cover-mustard',
  },
]

function App() {
  const [query, setQuery] = useState('')
  const [searchedQuery, setSearchedQuery] = useState('')
  const [albums, setAlbums] = useState([])
  const [searchState, setSearchState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const activeRequest = useRef(null)

  async function handleSearch(event) {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller

    setSearchedQuery(trimmedQuery)
    setSearchState('loading')
    setErrorMessage('')
    setAlbums([])

    try {
      const results = await searchAlbums(trimmedQuery, {
        signal: controller.signal,
      })

      setAlbums(results)
      setSearchState('success')
    } catch (error) {
      if (error.name === 'AbortError') return

      setErrorMessage(
        error.message || 'We could not reach the record room. Please try again.',
      )
      setSearchState('error')
    }
  }

  function handleGoHome(event) {
    event?.preventDefault()
    activeRequest.current?.abort()
    setQuery('')
    setSearchedQuery('')
    setAlbums([])
    setSearchState('idle')
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasSearched = searchState !== 'idle'

  return (
    <div className="app">
      <Header onHome={handleGoHome} />

      <main>
        {hasSearched ? (
          <section className="results-page" aria-labelledby="results-heading">
            <div className="results-intro">
              <button className="back-button" type="button" onClick={handleGoHome}>
                <span aria-hidden="true">←</span> Back home
              </button>

              <p className="eyebrow">The listening room found</p>
              <h1 id="results-heading">Albums for “{searchedQuery}”</h1>
              <p>
                Choose the album you meant, then you’ll be ready to give it your
                Lowdown.
              </p>
            </div>

            <SearchForm
              query={query}
              onQueryChange={setQuery}
              onSubmit={handleSearch}
              isLoading={searchState === 'loading'}
              compact
            />

            <div className="results-status" aria-live="polite">
              {searchState === 'loading' && (
                <div className="loading-state" role="status">
                  <span className="loading-record" aria-hidden="true" />
                  <p>Flipping through the crates…</p>
                </div>
              )}

              {searchState === 'error' && (
                <div className="message-card error-state" role="alert">
                  <h2>That search skipped.</h2>
                  <p>{errorMessage}</p>
                  <button type="button" onClick={handleSearch}>
                    Try again
                  </button>
                </div>
              )}

              {searchState === 'success' && albums.length === 0 && (
                <div className="message-card empty-state">
                  <h2>No albums found.</h2>
                  <p>Try a shorter album title or search using the artist’s name.</p>
                </div>
              )}
            </div>

            {searchState === 'success' && albums.length > 0 && (
              <>
                <p className="result-count">
                  Showing {albums.length} {albums.length === 1 ? 'album' : 'albums'}
                </p>
                <div className="results-grid">
                  {albums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : (
          <>
            <section className="lounge" aria-labelledby="home-heading">
              <div className="pit-layer pit-outer">
                <div className="pit-layer pit-middle">
                  <div className="pit-center">
                    <div className="vinyl-frame" aria-hidden="true">
                      <div className="vinyl">
                        <span className="vinyl-label" />
                        <span className="vinyl-reflection" />
                      </div>
                    </div>

                    <h1 id="home-heading">Lowdown</h1>

                    <div className="definition">
                      <p className="dictionary-entry">/ˈlōˌdoun/ · noun</p>
                      <p>the essential facts and information about something.</p>
                    </div>
                    <p className="intro">
                      Search for an album, rate it, and give your honest Lowdown.
                    </p>

                    <SearchForm
                      query={query}
                      onQueryChange={setQuery}
                      onSubmit={handleSearch}
                      isLoading={false}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="record-section" aria-labelledby="recents-heading">
              <div className="section-heading">
                <div>
                  <p>From the listening room</p>
                  <h2 id="recents-heading">Your Recents</h2>
                </div>
                <span>Recent searches will live here</span>
              </div>

              <div className="album-display">
                {recentPlaceholders.map((album) => (
                  <article className="recent-card" key={album.id}>
                    <div
                      className={`recent-cover ${album.coverClass}`}
                      aria-hidden="true"
                    >
                      <span>{album.title.charAt(0)}</span>
                    </div>
                    <h3>{album.title}</h3>
                    <p>{album.artist}</p>
                    <p>{album.year}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App