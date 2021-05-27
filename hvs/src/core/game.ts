import { each } from "lodash";
import { AbilityEnum } from "../components/ability/ability";
import { configuration } from "./configuration/configuration";
import AbilityBase from "./abilities/entities/ability-base";
import Spider from "./game-objects/enemies/spider";
import GameObject from "./game-objects/game-object";
import RandomHelper from "./helpers/random-helper";

export default class Game {
    readonly gameObjects: Array<GameObject> = [];
    readonly abilities: Array<AbilityBase> = [];

    onTick() {
        if (RandomHelper.withChance(0.36)){
            this.generateEnemy();
        }
        each(this.gameObjects, go => go.onTick());
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

    useAbility(ability: AbilityEnum) {

    }

    private generateEnemy() {
        this.createGameObject(new Spider(this,RandomHelper.getRandomRow(), configuration.enemyLocationSpawn, 10));
    }
}
