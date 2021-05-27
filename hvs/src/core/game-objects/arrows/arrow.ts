import { configuration } from "../../configuration/configuration";
import { GameObjectTypeEnum } from "../game-object-type.enum";
import ArrowBase from "./arrow-base";
import gameObject from "../game-object";

export default class Arrow extends ArrowBase {
    public onInteract(opposite: gameObject): void {
    }
    public getType(): GameObjectTypeEnum {
        return GameObjectTypeEnum.Arrow;
    }
    public onTick() {
        this.y = this.y - this.velocity * (configuration.tickTime / 1000);
    }
}
