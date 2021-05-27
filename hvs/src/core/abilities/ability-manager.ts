import { each } from "lodash";
import Game from "../game";
import { AbilitiesEnum } from "./abilities.enum";
import AbilityBase from "./entities/ability-base";
import ShootAbility from "./entities/shoot-ability";

export default class AbilityManager {
    private readonly abilities: { [key: string]: AbilityBase };
    private readonly game;

    constructor(game: Game) {
        this.game = game;
        this.abilities = this.initAbilities();
    }

    useAbility(ability: AbilitiesEnum) {
        this.abilities[ability].tryUse();
    }

    onTick() {
        each(this.abilities, ability => ability.onTick());
    }

    private initAbilities(): { [key: string]: AbilityBase } {
        return {
            [AbilitiesEnum.Shoot1]: new ShootAbility(this.game, 1500, 35, 1),
            [AbilitiesEnum.Shoot2]: new ShootAbility(this.game, 1500, 35, 2),
            [AbilitiesEnum.Shoot3]: new ShootAbility(this.game, 1500, 35, 3),
            [AbilitiesEnum.Shoot4]: new ShootAbility(this.game, 1500, 35, 4),
            [AbilitiesEnum.Shoot5]: new ShootAbility(this.game, 1500, 35, 5),
            [AbilitiesEnum.Shoot6]: new ShootAbility(this.game, 1500, 35, 6),
            [AbilitiesEnum.Shoot7]: new ShootAbility(this.game, 1500, 35, 7),
            [AbilitiesEnum.Shoot8]: new ShootAbility(this.game, 1500, 35, 8),
            [AbilitiesEnum.Shoot9]: new ShootAbility(this.game, 1500, 35, 9),
            [AbilitiesEnum.Shoot0]: new ShootAbility(this.game, 1500, 35, 10),
            [AbilitiesEnum.ShootDash]: new ShootAbility(this.game, 1500, 35, 11),
        };
    }
}
