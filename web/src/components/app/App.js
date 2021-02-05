import React from "react";

import './reset.css';
import './App.css';

import Header from "./header/header";
import Version from "./version/version";
import Editor from "../editor/editor";
import NotesRenderer from "../notesRenderer/notesRenderer";

export default class App extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      realtimeRender: true
    }

    this.canvasRef = React.createRef();
  }

  handleRenderNotes = (tracks, maxTaktCount, bpm, timeSignature, notesInTakt) => {
    this.canvasRef && this.canvasRef.current && this.canvasRef.current.draw(tracks, maxTaktCount, bpm, timeSignature, notesInTakt);
  }

  handleChangeRealtimeRender = (value) => {
    this.setState({realtimeRender: value})
  }

  render () {
    console.log('Render App');

    return <div className="App">
      <Header />
      <Editor onRenderNotes={this.handleRenderNotes} onChangeRealtimeRender={this.handleChangeRealtimeRender}/>
      <NotesRenderer ref={this.canvasRef} style={{display: this.state.realtimeRender ? 'block' : 'none'}}/>
      <Version value="1.0.1"/>
    </div>
  }
}