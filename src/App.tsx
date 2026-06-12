import './App.css'

function App() {
  return (
    <main className="background-only">
      <picture>
        <source
          media="(orientation: portrait)"
          srcSet="/backgrounds/reference-home-clean.png"
        />
        <img
          alt=""
          aria-hidden="true"
          className="reference-background-image"
          src="/backgrounds/reference-background-clean-wide.png"
        />
      </picture>
    </main>
  )
}

export default App
