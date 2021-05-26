import { Component } from "react";
import FieldState from "../../core/field-state";
import styles from "./field.module.css";

export interface FieldProps {
    fieldState: FieldState;
}

export default class Field extends Component<FieldProps> {
    render() {
        return <div className={styles.field}>

        </div>
    }
}