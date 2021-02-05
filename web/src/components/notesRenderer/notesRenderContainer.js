import {connect} from "react-redux";
import NotesRenderer from "./notesRenderer";

const mapStateToProps = state => {
    const realtimeRender = state.editor.realtimeRender;
    return {realtimeRender};
}

export default connect(mapStateToProps, null, null, {forwardRef: true})(NotesRenderer);