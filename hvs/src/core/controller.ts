import FieldState from "./field-state";
import Kernel from "./kernel";

export default class Controller {
    private _kernel : Kernel;

    constructor(kernel : Kernel) {
        this._kernel = kernel;
    }

    shoot(index: number) {
        console.log(index);
    }

    getFieldState(): FieldState {
        return {};
    }
}