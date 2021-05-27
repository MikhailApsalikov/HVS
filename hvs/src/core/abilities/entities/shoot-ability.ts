import { configuration } from "../../configuration/configuration";
import Game from "../../game";
import Arrow from "../../entities/arrows/arrow";
import AbilityBase from "./ability-base";

export default class ShootAbility extends AbilityBase {
    public readonly row: number;

    constructor(game: Game, cooldown: number, energyCost: number, row: number) {
        super(game, cooldown, energyCost);
        this.row = row;
    }

    public onUse(): void {
        this.game.createGameObject(new Arrow(this.game, this.row, configuration.height + configuration.arrowLocationSpawn, 60));
    }
}
