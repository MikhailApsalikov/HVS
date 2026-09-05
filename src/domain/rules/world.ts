export const WORLD = {
  lanes: 9,
  fixedStep: 1 / 60,
  maxFrameTime: 0.1,
  hitRadius: 0.05,
  deathDuration: 0.3,
  coinMin: 1,
  coinMax: 3,
  jackpotMultiplier: 3,
  saleFactor: 0.5,
  ninjaJumpMin: 0.1,
  ninjaJumpMax: 0.5,
} as const;
