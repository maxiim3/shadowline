export type MovementMode = 'idle' | 'walk' | 'sprint'

export interface ExposureInput {
  crouching: boolean
  inShadow: boolean
  lightsEnabled: boolean
  movement: MovementMode
}

export interface NoiseInput {
  crouching: boolean
  movement: MovementMode
  surfaceMultiplier: number
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum)

export function calculateExposure(input: ExposureInput): number {
  const ambientLight = input.lightsEnabled
    ? input.inShadow
      ? 0.28
      : 0.82
    : input.inShadow
      ? 0.08
      : 0.32
  const stanceModifier = input.crouching ? 0.72 : 1
  const movementModifier = input.movement === 'sprint' ? 1.16 : 1

  return clamp(ambientLight * stanceModifier * movementModifier, 0.05, 1)
}

export function calculateNoiseRadius(input: NoiseInput): number {
  const baseRadius = input.movement === 'sprint' ? 260 : input.movement === 'walk' ? 145 : 0
  const crouchModifier = input.crouching ? 0.42 : 1

  return Math.round(baseRadius * crouchModifier * input.surfaceMultiplier)
}

export function nextDetectionLevel(
  currentLevel: number,
  exposure: number,
  canSeePlayer: boolean,
  elapsedSeconds: number,
): number {
  if (!canSeePlayer) {
    return clamp(currentLevel - elapsedSeconds * 0.28, 0, 1)
  }

  return clamp(currentLevel + exposure * elapsedSeconds * 0.82, 0, 1)
}
