export class Arrow {
  y = 1;
  previousY = 1;
  constructor(
    readonly id: string,
    readonly lane: number,
    readonly speed: number,
    readonly fromVolley = false,
  ) {}
  move(dt: number): void {
    this.previousY = this.y;
    this.y -= this.speed * dt;
  }
}
