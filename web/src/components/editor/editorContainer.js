import {connect} from "react-redux";
import {setRealtimeRender, taktCopy, taktPaste, taktClear, taktDelete, taktAdd, setPlayerState, setEndOfTrack, setTrackVolume} from "../../redux/actions";
import {GetBpms} from "../../redux//selectors";

import Editor from "./editor";

const mapStateToProps = state => {
    const editor = state.editor;
    const bpms = GetBpms(state);
    return {...editor, bpms};
}

export default connect(mapStateToProps, {setRealtimeRender, taktCopy, taktPaste, taktClear, taktDelete, taktAdd, setPlayerState, setEndOfTrack, setTrackVolume}) (Editor)