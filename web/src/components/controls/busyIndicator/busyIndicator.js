
import React from "react";
import "./busyIndicator.css";

export default class BusyIndicator extends React.PureComponent {

    render() {
        //console.log("Redner BusyIndicator")
        return <div className={"busy-indicator " + (this.props.busy ? "busy-indicator--busy" : "")}>
            <div className="busy-indicator__content">{this.props.text || "LOADING"}</div>
        </div>
    }
}