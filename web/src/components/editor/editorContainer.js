import {connect} from "react-redux";
import {
    setRealtimeRender, taktCopy, taktPaste, taktClear, taktDelete, taktAdd 
    ,setPlayerState, setEndOfTrack, setTrackVolume, setBaseTime
    ,renderNotes, loadUserAudio, setTrackLoaded, setTrackOffset
} from "../../redux/actions";
import {GetBpms} from "../../redux//selectors";

import Editor from "./editor";

const mapStateToProps = state => {
    const editor = state.editor;
    const bpms = GetBpms(state);
    const loader = state.loader;
    return {...editor, bpms, loader: {...loader}};
}

export default connect(
    mapStateToProps, 
    {
        setRealtimeRender, taktCopy, taktPaste, taktClear, taktDelete, 
        taktAdd, setPlayerState, setEndOfTrack, setTrackVolume, setBaseTime,
        renderNotes, loadUserAudio, setTrackLoaded, setTrackOffset
    }
) (Editor)