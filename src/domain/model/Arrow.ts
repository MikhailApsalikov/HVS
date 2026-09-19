export class Arrow {
  y = 1;
  previousY = 1;
  kills = 0;
  constructor(
    readonly id: string,
    readonly lane: number,
    readonly speed: number,
    readonly fromVolley = false,
    readonly critical = false,
  ) {}
  move(dt: number): void {
    this.previousY = this.y;
    this.y -= this.speed * dt;
  }
}
