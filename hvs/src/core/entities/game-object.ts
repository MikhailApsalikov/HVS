export default abstract class GameObject {
    constructor(x: number, y: number) {

    }

    abstract onInteract(opposite: GameObject): void;
}