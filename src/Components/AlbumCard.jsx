import { useState } from 'react'

function AlbumCard({ album }) {
  const [coverFailed, setCoverFailed] = useState(false)
  const showCover = Boolean(album.coverUrl) && !coverFailed

  return (
    <article className="album-card">
      <button type="button">
        <div className="album-visual">
          <div className="album-record" aria-hidden="true"></div>

          <div className={`album-cover ${album.coverClass || ''}`.trim()}>
            {showCover ? (
              <img
                className="album-cover-image"
                src={album.coverUrl}
                alt={`Cover of ${album.title} by ${album.artist}`}
                onError={() => setCoverFailed(true)}
              />
            ) : (
              <span aria-hidden="true">{album.title.charAt(0)}</span>
            )}
          </div>
        </div>

        <div className="album-details">
          <h3>{album.title}</h3>
          <p>{album.artist}</p>
          <p>{album.year}</p>
        </div>
      </button>
    </article>
  )
}

export default AlbumCard