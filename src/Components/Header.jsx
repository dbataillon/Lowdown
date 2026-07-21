function Header({ onHome }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="/" onClick={onHome} aria-label="Lowdown home">
        Lowdown
      </a>

      <nav aria-label="Primary navigation">
        <a href="/" onClick={onHome}>
          Home
        </a>
        <a href="#my-lowdowns">My Lowdowns</a>
      </nav>
    </header>
  )
}

export default Header