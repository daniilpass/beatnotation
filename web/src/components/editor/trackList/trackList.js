import React from "react";

import Track from "../track/track";
import "./trackList.css";


export default class TrackList extends React.Component {  

    shouldComponentUpdate(nextProps){ 
        if (this.props.trackControlWidth !== nextProps.trackControlWidth            
            || this.props.noteHeight !== nextProps.noteHeight
            || this.props.noteWidth !== nextProps.noteWidth
            || this.props.addTaktButtonWidth !== nextProps.addTaktButtonWidth
            || this.props.bpm !== nextProps.bpm
            || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes            
            || this.props.tracksLengthInTakts !== nextProps.tracksLengthInTakts            
            || this.props.timeSignature !== nextProps.timeSignature
            || this.props.tracks !== nextProps.tracks
            || this.props.canImportAudio !== nextProps.canImportAudio) {
        return true;
      }
      return false;
    }

    handleUserAudioLoaded = (trackIndex, buffer) => {
        this.props.loadUserAudio(trackIndex, buffer);
    }

    handleTrackVolumeChange = (trackIndex, value) => {
        this.props.setTrackVolume(trackIndex, value);
    }

    handleTrackIsMuteChange = (trackIndex) => {
        this.props.setTrackIsMute(trackIndex);
    }

    handleClearTrack = (trackIndex) => {
        this.props.clearTrack(trackIndex);
        if (this.props.realtimeRender) {
            this.props.renderNotes();
        }
    }

    onNoteClick = (trackIndex, taktIndex, noteIndex, level) => {
        this.props.onNoteClick && this.props.onNoteClick(trackIndex, taktIndex, noteIndex, level);
    }

    render() {
      console.log('Render TrackList');
      return [
            this.props.tracks.map((_track,i) => {
            return <Track key={"track_"+i} index={i} track={_track} ts={_track.ts}                             
                            noteClick={this.onNoteClick}  
                            onUserAudioLoaded={this.handleUserAudioLoaded}
                            onVolumeChange={this.handleTrackVolumeChange} onTrackIsMute={this.handleTrackIsMuteChange} onClearTrack={this.handleClearTrack} 
                            {...this.props}/>
            })
        ]
    }
  }