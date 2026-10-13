export type GameEvent =
  | {
      readonly type: 'coinDrop';
      readonly spiderId: string;
      readonly coins: number;
      readonly jackpot: boolean;
    }
  | {
      readonly type: 'damage';
      readonly spiderId: string;
      readonly hp: number;
      readonly energy: number;
      readonly blockedDamage?: number;
      readonly dodged?: boolean;
      readonly piercing?: boolean;
      readonly rawDamageMultiplier?: number;
    }
  | {
      readonly type: 'resourceGain';
      readonly spiderId: string;
      readonly hp: number;
      readonly energy: number;
      readonly reason: 'kill' | 'breach';
    }
  | { readonly type: 'absorb' };
export type EmitEvent = (event: GameEvent) => void;
