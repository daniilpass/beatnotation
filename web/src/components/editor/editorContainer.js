import {connect} from "react-redux";
import {
    setRealtimeRender, taktCopy, taktPaste, taktClear, taktDelete, taktAdd 
    ,setPlayerState, setEndOfTrack, setTrackVolume, setBaseTime
    ,renderNotes, loadUserAudio, setTrackLoaded, setTrackOffset
    ,setTrackIsMute, setAppBusy
} from "../../redux/actions";
import {GetBpms, CanImportAudio} from "../../redux//selectors";

import Editor from "./editor";

const mapStateToProps = state => {
    const editor = state.editor;
    const bpms = GetBpms(state);
    const loader = state.loader;
    const app = state.app;
    const canImportAudio = CanImportAudio(state);
    return {...editor, bpms, loader: {...loader}, app: {...app}, canImportAudio};
}

export default connect(
    mapStateToProps, 
    {setRealtimeRender, taktCopy, taktPaste, taktClear, taktDelete, 
        taktAdd, setPlayerState, setEndOfTrack, setTrackVolume, setBaseTime,
        renderNotes, loadUserAudio, setTrackLoaded, setTrackOffset, setTrackIsMute, setAppBusy}
) (Editor)