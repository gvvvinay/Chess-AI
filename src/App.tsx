import Game from './components/Game'
import './App.css'

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white font-sans">
      <h1 className="text-3xl font-bold mb-6 text-violet-400">Chess AI</h1>
      <Game />
    </div>
  )
}

export default App
