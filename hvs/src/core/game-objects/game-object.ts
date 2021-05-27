import { GameObjectTypeEnum } from "./game-object-type.enum";
import Game from "../game";
import IdHelper from "../helpers/id-helper";

export default abstract class GameObject {
    public velocity: number;
    public readonly id: number;

    protected row: number;
    protected y: number;
    protected readonly game: Game;

    constructor(game: Game, row: number, y: number, velocity: number) {
        this.game = game;
        this.row = row;
        this.y = y;
        this.velocity = velocity;
        this.id = IdHelper.getNextId();
    }

    public getRow() {
        return this.row;
    }

    public getY() {
        return this.y;
    }

    public abstract onInteract(opposite: GameObject): void;
    public abstract onTick(): void;
    public abstract getType(): GameObjectTypeEnum;
}
