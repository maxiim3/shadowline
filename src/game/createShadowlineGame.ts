import Phaser from 'phaser'
import { StealthLabScene } from './scenes/StealthLabScene'

const GAME_WIDTH = 1280
const GAME_HEIGHT = 720

export function createShadowlineGame(mountNode: HTMLDivElement): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mountNode,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#05091a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1300 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [StealthLabScene],
  })

  return () => {
    game.destroy(true)
  }
}
