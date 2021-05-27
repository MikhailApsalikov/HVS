import { GameObjectTypeEnum } from "../../enums/game-object-type.enum";
import Enemy from "./enemy";
import gameObject from "../game-object";

export default class Spider extends Enemy {
    public onInteract(opposite: gameObject): void {

    }

    public getType(): GameObjectTypeEnum {
        return GameObjectTypeEnum.Spider;
    }
}
