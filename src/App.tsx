import { useEffect, useRef } from 'react'
import { createShadowlineGame } from './game/createShadowlineGame'

export function App() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mountNode = mountRef.current

    if (mountNode === null) {
      return undefined
    }

    return createShadowlineGame(mountNode)
  }, [])

  return (
    <main className="game-shell">
      <h1 className="sr-only">Shadowline Nightshift, mission d’infiltration 2D à caméra fixe</h1>
      <div className="game-shell__canvas" ref={mountRef} />
    </main>
  )
}
