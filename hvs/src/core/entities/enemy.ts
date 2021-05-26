import { configuration } from "../configuration";
import GameObject from "./game-object";

export default abstract class Enemy extends GameObject {
    constructor(row: number, y: number, velocity: number) {
        super(row, y, velocity);
    }

    public onTick() {
        this.y = this.y + this.velocity * (configuration.tickTime / 1000);
    }
}