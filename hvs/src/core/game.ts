import { each } from "lodash";
import { AbilitiesEnum } from "./abilities/abilities.enum";
import AbilityManager from "./abilities/ability-manager";
import { configuration } from "./configuration/configuration";
import Spider from "./game-objects/enemies/spider";
import GameObject from "./game-objects/game-object";
import RandomHelper from "./helpers/random-helper";

export default class Game {
    private readonly gameObjects: Array<GameObject> = [];
    private readonly abilityManager: AbilityManager;

    constructor() {
        this.abilityManager = new AbilityManager(this);
    }

    onTick() {
        if (RandomHelper.withChance(0.36)) {
            this.generateEnemy();
        }
        each(this.gameObjects, go => go.onTick());
        this.abilityManager.onTick();
    }

    destroy(gameObject: GameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }
    }

    createGameObject(gameObject: GameObject) {
        this.gameObjects.push(gameObject);
    }

    getGameObjects() {
        return this.gameObjects;
    }

    private generateEnemy() {
        this.createGameObject(new Spider(this, RandomHelper.getRandomRow(), configuration.enemyLocationSpawn, 10));
    }

    useAbility(ability: AbilitiesEnum) {
        this.abilityManager.useAbility(ability);
    }
}
