function SearchForm({ query, onQueryChange, onSubmit, isLoading, compact = false }) {
  return (
    <form
      className={`album-search${compact ? ' album-search--compact' : ''}`}
      onSubmit={onSubmit}
    >
      <label htmlFor={compact ? 'results-album-query' : 'album-query'}>
        Search by album or artist
      </label>

      <div className="search-controls">
        <input
          id={compact ? 'results-album-query' : 'album-query'}
          name="album-query"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Album or artist"
          autoComplete="off"
          required
        />

        <button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  )
}

export default SearchForm
