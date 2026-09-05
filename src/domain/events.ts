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
    }
  | { readonly type: 'absorb' };
export type EmitEvent = (event: GameEvent) => void;
