import Controller from "./controller";

export default class Kernel {
    private _controller : Controller;
    public get controller() : Controller {
        return this._controller;
    }

    constructor() {
        this._controller = new Controller(this);
    }
}