import React from "react";

export default class UserFileReader extends React.PureComponent {

    constructor(props){
      super(props);
  
      this.input = React.createRef();
    }
  
    selectFile = () => {
      this.input.current.click();
    }
  
    fileInputChange = (e) => {
      this.loadFile();
    }
  
    loadFile = () => {
      if (this.input.current.files.length === 0) {
        return;
      } 
  
      let file = this.input.current.files[0];
      var reader = new FileReader();
      reader.onload = (re) => {
        var fileContent = re.target.result;
        this.props.onFileLoaded && this.props.onFileLoaded(fileContent);
      }
      reader.onerror = () => {
        alert("Can't load file");
      }
      reader.readAsText(file);    
    }
    
    
  
    render() {
      return <div style={{display:"none"}}> 
              <input type="file" ref={this.input} onChange={this.fileInputChange} accept={this.props.accept}></input>
            </div>
    }
  }