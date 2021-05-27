import FieldState from "./interfaces/field-state";
import Game from "./game";

export default class Controller {
    private _game: Game;

    constructor(game: Game) {
        this._game = game;
    }

    shoot(index: number) {
        console.log(index);
    }

    getFieldState(): FieldState {
        return {
            gameObjects: this._game.gameObjects.map(go => {
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
