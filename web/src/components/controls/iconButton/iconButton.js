
import React from "react";
import "./iconButton.css";

export default class IconButton extends React.PureComponent {

    onClick = () => {
        !this.props.disabled && this.props.onClick && this.props.onClick();
    }

    render() {
        return <div className={"icon-button"+(this.props.disabled ? " icon-button--disabled" : "")} onClick={this.onClick} title={this.props.title}>
            {this.props.icon}
        </div>
    }
}