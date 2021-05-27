import { configuration } from "../../configuration/configuration";
import Game from "../../game";

export default abstract class AbilityBase {
    protected readonly game: Game;
    private currentCooldown: number;
    private cooldown: number;
    private energyCost: number;

    constructor(game: Game, cooldown: number, energyCost: number) {
        this.game = game;
        this.cooldown = cooldown;
        this.energyCost = energyCost;
        this.currentCooldown = 0;
    }

    public abstract onUse(): void;

    public onTick(): void {
        if (this.isOnCooldown()) {
            this.currentCooldown-=configuration.tickTime;
        }
    }


    public tryUse(): void {
        if (this.isOnCooldown()){
            return;
        }
        this.onUse();
        this.currentCooldown = this.cooldown;
    }


    public isOnCooldown(): boolean {
        return this.currentCooldown > 0;
    }
}
