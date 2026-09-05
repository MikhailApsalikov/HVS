export type RandomSource = () => number;

export function randomInt(random: RandomSource, min: number, max: number): number {
  return Math.floor(random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}

export function pickLanes(random: RandomSource, count: number, total: number): number[] {
  const lanes = Array.from({ length: total }, (_, index) => index);
  const chosen: number[] = [];
  while (chosen.length < count && lanes.length > 0) {
    chosen.push(...lanes.splice(randomInt(random, 0, lanes.length - 1), 1));
  }
  return chosen;
}
