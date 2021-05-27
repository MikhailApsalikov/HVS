import { configuration } from "../../configuration/configuration";
import GameObject from "../game-object";

export default abstract class Enemy extends GameObject {
    public onTick() {
        this.y = this.y + this.velocity * (configuration.tickTime / 1000);
    }
}
