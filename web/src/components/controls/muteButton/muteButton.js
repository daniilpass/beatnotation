
import React from "react";
import "./muteButton.css";

export default class MuteButton extends React.PureComponent {

    render() {
        return <div className={"mute-button "+(this.props.isMuted ? "mute-button--muted" : "mute-button--unmuted")} onClick={this.props.onClick}>
            <div className="mute-button__switch"></div>
        </div>
    }
}