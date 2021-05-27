import classnames from "classnames";
import { Component } from "react";
import { AbilitiesEnum } from "../../core/abilities/abilities.enum";
import styles from "./ability.module.css";

export interface AbilityProps {
    hotkey: string;
    ability: AbilitiesEnum;
    onClick: () => void;
}

export default class Ability extends Component<AbilityProps> {
    render() {
        return <div className={classnames(styles.ability, styles[this.props.ability])} onClick={() => this.props.onClick()}><div className={styles.hotkey}>{this.props.hotkey}</div></div>
    }
}
