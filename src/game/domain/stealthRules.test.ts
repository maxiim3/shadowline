import { describe, expect, it } from 'vitest'
import { calculateExposure, calculateNoiseRadius, nextDetectionLevel } from './stealthRules'

describe('stealth rules', () => {
  it('makes a crouched player in darkness less exposed than a sprinting player in light', () => {
    const hidden = calculateExposure({
      crouching: true,
      inShadow: true,
      lightsEnabled: true,
      movement: 'walk',
    })
    const visible = calculateExposure({
      crouching: false,
      inShadow: false,
      lightsEnabled: true,
      movement: 'sprint',
    })

    expect(hidden).toBeLessThan(visible)
  })

  it('keeps crouched movement quieter than sprinting on the same surface', () => {
    const quiet = calculateNoiseRadius({
      crouching: true,
      movement: 'walk',
      surfaceMultiplier: 1,
    })
    const loud = calculateNoiseRadius({
      crouching: false,
      movement: 'sprint',
      surfaceMultiplier: 1,
    })

    expect(quiet).toBeLessThan(loud)
  })

  it('raises detection in view and decays it after the player disappears', () => {
    const alerted = nextDetectionLevel(0.2, 0.8, true, 0.5)
    const recovered = nextDetectionLevel(alerted, 0.8, false, 1)

    expect(alerted).toBeGreaterThan(0.2)
    expect(recovered).toBeLessThan(alerted)
  })
})
