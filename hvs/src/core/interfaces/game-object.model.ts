import { GameObjectTypeEnum } from "../game-objects/game-object-type.enum";

export default interface GameObjectModel {
    id: number;
    row: number;
    y: number;
    type: GameObjectTypeEnum;
}
