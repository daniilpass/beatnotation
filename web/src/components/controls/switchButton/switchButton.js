
import React from "react";
import "./switchButton.css";

export default class SwitchButton extends React.PureComponent {

    render() {
        return <label className={"switch-button " + (this.props.checked ? "switch-button--checked" : "switch-button--unchecked")} title={this.props.title}>
                {this.props.icon}
                <input name={this.props.name} onChange={this.props.onChange} checked={this.props.checked} type="checkbox" style={{display: "none"}}></input>
        </label>
    }
}