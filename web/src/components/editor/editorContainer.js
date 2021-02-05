import {connect} from "react-redux";
import {setRealtimeRender} from "../../redux/actions";

import Editor from "./editor";

const mapStateToProps = state => {
    const editor = state.editor;
    return {...editor};
}

export default connect(mapStateToProps, {setRealtimeRender}) (Editor)