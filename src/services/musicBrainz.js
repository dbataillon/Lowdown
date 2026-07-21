const MUSICBRAINZ_BASE_URL =
  'https://musicbrainz.org/ws/2/release-group/'
const COVER_ART_BASE_URL =
  'https://coverartarchive.org/release-group'
const MINIMUM_REQUEST_INTERVAL = 1000

let lastRequestStartedAt = 0

function escapeLucene(value) {
  return value.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1')
}

function normalizeForComparison(value = '') {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeExactTitle(value = '') {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function formatArtistCredit(artistCredit = []) {
  if (artistCredit.length === 0) return 'Unknown artist'

  return artistCredit
    .map(
      (credit) =>
        `${credit.name || credit.artist?.name || ''}${
          credit.joinphrase || ''
        }`,
    )
    .join('')
    .trim()
}

function mapReleaseGroup(releaseGroup) {
  const secondaryTypes = releaseGroup['secondary-types'] || []
  const primaryType = releaseGroup['primary-type'] || 'Album'

  return {
    id: releaseGroup.id,
    title: releaseGroup.title,
    artist: formatArtistCredit(releaseGroup['artist-credit']),
    year:
      releaseGroup['first-release-date']?.slice(0, 4) ||
      'Year unknown',
    type: [primaryType, ...secondaryTypes].join(' · '),
    score: Number(releaseGroup.score || 0),
    coverUrl:
      `${COVER_ART_BASE_URL}/${releaseGroup.id}/front-250`,
  }
}

function getLocalRelevance(album, query) {
  const exactQuery = normalizeExactTitle(query)
  const exactTitle = normalizeExactTitle(album.title)

  const normalizedQuery = normalizeForComparison(query)
  const normalizedTitle = normalizeForComparison(album.title)
  const normalizedArtist = normalizeForComparison(album.artist)

  let relevance = album.score

  // Preserve punctuation for the strongest match. For example,
  // searching "Raise!" ranks "Raise!" above albums named "Raise".
  if (exactTitle === exactQuery) {
    relevance += 10000
  } else if (normalizedTitle === normalizedQuery) {
    relevance += 8000
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    relevance += 4000
  } else if (normalizedTitle.includes(normalizedQuery)) {
    relevance += 2000
  }

  // Also support searches by artist.
  if (normalizedArtist === normalizedQuery) {
    relevance += 9000
  } else if (normalizedArtist.includes(normalizedQuery)) {
    relevance += 1000
  }

  return relevance
}

function waitForRateLimit(signal) {
  const waitTime = Math.max(
    0,
    MINIMUM_REQUEST_INTERVAL -
      (Date.now() - lastRequestStartedAt),
  )

  if (waitTime === 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    function handleAbort() {
      globalThis.clearTimeout(timeout)

      reject(
        new DOMException('Search cancelled.', 'AbortError'),
      )
    }

    const timeout = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, waitTime)

    signal?.addEventListener('abort', handleAbort, {
      once: true,
    })
  })
}

export async function searchAlbums(
  query,
  { signal } = {},
) {
  const trimmedQuery = query.trim()
  const escapedQuery = escapeLucene(trimmedQuery)

  const searchExpression =
    `(releasegroup:"${escapedQuery}" OR ` +
    `artist:"${escapedQuery}") AND primarytype:album`

  const params = new URLSearchParams({
    query: searchExpression,
    fmt: 'json',
    limit: '20',
  })

  await waitForRateLimit(signal)
  lastRequestStartedAt = Date.now()

  const response = await fetch(
    `${MUSICBRAINZ_BASE_URL}?${params}`,
    {
      headers: {
        Accept: 'application/json',
      },
      signal,
    },
  )

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error(
        'MusicBrainz is busy right now. Wait a moment and try again.',
      )
    }

    throw new Error(
      `Album search failed with status ${response.status}.`,
    )
  }

  const data = await response.json()

  return (data['release-groups'] || [])
    .map(mapReleaseGroup)
    .sort(
      (first, second) =>
        getLocalRelevance(second, trimmedQuery) -
        getLocalRelevance(first, trimmedQuery),
    )
}