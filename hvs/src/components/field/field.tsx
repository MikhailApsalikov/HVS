import { Component } from "react";
import { configuration } from "../../core/configuration/configuration";
import { GameObjectTypeEnum } from "../../core/game-objects/game-object-type.enum";
import FieldState from "../../core/interfaces/field-state";
import GameObjectModel from "../../core/interfaces/game-object.model";
import styles from "./field.module.css";
import spider from '../../resources/images/spider.svg';

export interface FieldProps {
    fieldState: FieldState;
}

export default class Field extends Component<FieldProps> {
    render() {
        return (
            <div className={styles.field}>
                {this.props.fieldState.gameObjects.map(go => {
                    return <div key={go.id} className={styles.gameObject} style={{ left: this.getLeftByRow(go.row), top: go.y }}>
                        {this.renderObject(go)}
                    </div>;
                })}
            </div>
        );
    }

    private renderObject(gameObject: GameObjectModel): JSX.Element {
        switch (gameObject.type) {
            case GameObjectTypeEnum.Spider:
                return <img className={styles.spider} src={spider} alt="spider" />;
            default:
                return <></>;
        }
    }

    private getLeftByRow(row: number): number {
        return (configuration.width / configuration.linesCount - 0.5) * (row - 1);
    }
}
