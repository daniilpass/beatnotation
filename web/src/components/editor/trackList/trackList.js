import React from "react";

import Track from "../track/track";
import "./trackList.css";


export default class TrackList extends React.Component {  

    shouldComponentUpdate(nextProps){ 
        if (this.props.trackControlWidth !== nextProps.trackControlWidth            
            || this.props.noteHeight !== nextProps.noteHeight
            || this.props.noteWidth !== nextProps.noteWidth
            || this.props.addTaktButtonWidth !== nextProps.addTaktButtonWidth
            || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes            
            || this.props.tracksLengthInTakts !== nextProps.tracksLengthInTakts            
            || this.props.timeSignature !== nextProps.timeSignature
            || this.props.tracks !== nextProps.tracks) {
        return true;
      }
      return false;
    }

    handleTrackVolumeChange = (trackIndex, value) => {
        console.log("handleTrackVolumeChange", trackIndex, value);
        this.props.setTrackVolume(trackIndex, value);
    }

    handleTrackIsMuteChange = (trackIndex) => {
        this.props.setTrackIsMute(trackIndex);
    }

    onNoteClick = (trackIndex, taktIndex, noteIndex, level) => {
        this.props.onNoteClick && this.props.onNoteClick(trackIndex, taktIndex, noteIndex, level);
    }

    render() {
      console.log('Render TrackList');
      return [
            this.props.tracks.map((_track,i) => {
            return <Track key={"track_"+i} index={i} noteWidth={this.props.noteWidth} noteHeight={this.props.noteHeight} 
                            trackControlWidth={this.props.trackControlWidth} addTaktButtonWidth={this.props.addTaktButtonWidth} 
                            tracksLengthInNotes={this.props.tracksLengthInNotes} tracksLengthInTakts={this.props.tracksLengthInTakts} 
                            timeSignature={this.props.timeSignature} track={_track} ts={_track.ts}                             
                            noteClick={this.onNoteClick}  onVolumeChange={this.handleTrackVolumeChange} onTrackIsMute={this.handleTrackIsMuteChange}
                            loadUserAudio={this.props.loadUserAudio}
                            bpms = {this.props.bpms} notesInPartCount={this.props.notesInPartCount} setTrackOffset={this.props.setTrackOffset}/>
            })
        ]
    }
  }