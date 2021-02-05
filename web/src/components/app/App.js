import React from "react";

import './reset.css';
import './App.css';

import Header from "./header/header";
import Version from "./version/version";
import Editor from "../editor/editorContainer";
import NotesRenderer from "../notesRenderer/notesRenderContainer";

export default class App extends React.Component {
  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  handleRenderNotes = (tracks, maxTaktCount, bpm, timeSignature, notesInTakt, dontRepeat) => {
    if (this.canvasRef && this.canvasRef.current) {
      this.canvasRef.current.draw(tracks, maxTaktCount, bpm, timeSignature, notesInTakt);      
    } else if (!dontRepeat){
      console.log('canvas not ready, second try...');
      setTimeout(() =>  {
        this.handleRenderNotes(tracks, maxTaktCount, bpm, timeSignature, notesInTakt, true);
      }, 1);
    }     
  }

  render () {
    console.log('Render App');

    return <div className="App">
      <Header />
      <Editor onRenderNotes={this.handleRenderNotes} />
      <NotesRenderer ref={this.canvasRef} />
      <Version value="1.0.1"/>
    </div>
  }
}