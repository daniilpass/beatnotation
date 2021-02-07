import React from "react";

import './reset.css';
import './App.css';

import Header from "./header/header";
import Version from "./version/version";
import Editor from "../editor/editorContainer";
import NotesRenderer from "../notesRenderer/notesRenderContainer";

export default class App extends React.Component {
  render () {
    console.log('Render App');

    return <div className="App">
      <Header />
      <Editor />
      <NotesRenderer />
      <Version value="1.0.1"/>
    </div>
  }
}