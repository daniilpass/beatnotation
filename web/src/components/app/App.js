import React from "react";

import './reset.css';
import './App.css';

import Header from "./header/header";
import Version from "./version/version";
import Editor from "../editor/editorContainer";
import NotesRenderer from "../notesRenderer/notesRenderContainer";

export default class App extends React.Component {

  constructor(props){
    super(props);

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
  }

  render () { 
    console.log('Render App');

    return <div className="App">
      <Header />
      <Editor />
      <NotesRenderer />
      <Version />      
    </div>
  }
}