import classnames from "classnames";
import { Component } from "react";
import styles from "./ability.module.css";

export enum AbilityEnum {
    Shoot = "shoot"
}

export interface AbilityProps {
    hotkey: string;
    ability: AbilityEnum;
    onClick: () => void;
}

export default class Ability extends Component<AbilityProps> {
    render() {
        return <div className={classnames(styles.ability, styles[this.props.ability])}><div className={styles.hotkey}>{this.props.hotkey}</div></div>
    }
}