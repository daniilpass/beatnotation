import {connect} from "react-redux";
import NotesRenderer from "./notesRenderer";

const mapStateToProps = state => {
    const realtimeRender = state.editor.realtimeRender;
    const canvas = state.canvas;
    const editor = state.editor;
    return {realtimeRender, ...canvas, ...editor};
}

export default connect(mapStateToProps, null, null, {forwardRef: true})(NotesRenderer);