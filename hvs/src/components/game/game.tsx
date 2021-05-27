import { Component } from "react";
import Field from "../field/field";
import styles from "./game.module.css";
import { range } from "lodash";
import Ability from "../ability/ability";
import Controller from "../../core/controller";
import { configuration } from "../../core/configuration/configuration";
import { AbilitiesEnum } from "../../core/abilities/abilities.enum";

export interface GameProps {
    controller: Controller;
}

export default class Game extends Component<GameProps> {
    interval: NodeJS.Timeout | null = null;

    private shoot(index: number) {
        this.props.controller.useAbility(configuration.shootAbilities[index].name as AbilitiesEnum);
    }

    componentDidMount() {
        this.interval = setInterval(() => this.setState({ time: Date.now() }), configuration.tickTime);
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    render() {
        return <div className={styles.game}>
            <div className={styles.fieldContainer}>
                <Field fieldState={this.props.controller.getFieldState()} />
                <div className={styles.arrowContainer}>
                    {range(1, configuration.linesCount + 1, 1).map(arrowIndex => <Ability key={arrowIndex} hotkey={configuration.shootAbilities[arrowIndex].hotkey} onClick={() => this.shoot(arrowIndex)} ability={configuration.shootAbilities[arrowIndex].name} />)}
                </div>
            </div>
            <div className={styles.actionsContainer}>
                <div className={styles.resources}>
                    <div className={styles.health}>Health</div>
                    <div className={styles.energy}>Energy</div>
                </div>
                <div className={styles.abilities}>Abilities</div>
                <div className={styles.items}>Items</div>
                <div className={styles.info}>Info (Level, time left, score, gold)</div>
                <div className={styles.log}>Log</div>
            </div>
        </div>
    }
}
