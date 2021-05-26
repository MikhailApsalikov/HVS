import { Component } from "react";
import styles from "./field.module.css";

export interface FieldProps {

}

export default class Field extends Component<FieldProps> {
    render() {
        return <div className={styles.field}>Field</div>
    }
}