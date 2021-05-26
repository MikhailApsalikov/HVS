import { configuration } from "./configuration";
import Controller from "./controller";
import Game from "./game";

export default class Kernel {
    private game: Game;
    
    private _controller : Controller;
    public get controller() : Controller {
        return this._controller;
    }

    constructor() {
        this.game = new Game();
        this._controller = new Controller(this.game);
        window.setInterval(() => {
            this.game.onTick();
        }, configuration.tickTime);
    }
}