import FieldState from "./interfaces/field-state";
import Game from "./game";
import { AbilitiesEnum } from "./abilities/abilities.enum";

export default class Controller {
    private _game: Game;

    constructor(game: Game) {
        this._game = game;
    }

    useAbility(ability: AbilitiesEnum) {
        this._game.useAbility(ability);
    }

    getFieldState(): FieldState {
        return {
            gameObjects: this._game.getGameObjects().map(go => {
                return {
                    id: go.id,
                    row: go.getRow(),
                    y: go.getY(),
                    type: go.getType()
                };
            }),
        };
    }
}
