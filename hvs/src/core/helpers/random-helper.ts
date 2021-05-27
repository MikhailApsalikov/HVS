import { configuration } from "../configuration/configuration";

export default class RandomHelper {
    public static withChance(percent: number): boolean {
        return Math.random() < (percent / 100);
    }

    public static getRandomRow(): number {
        return Math.round(Math.random() * configuration.linesCount + 1);
    }
}
