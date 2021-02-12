import React from "react";
import {connect} from "react-redux";

import styles from './version.module.css';
class Version extends React.PureComponent {  
  
  /*Major.Minor.Fixes*/
  render() {
    return <div className={styles['app-ver'] + " no-print"}>{this.props.version}</div>  
  }
}

const mapStateToProps = state => {
  const version = state.app.version;
  return {version};
}

export default connect(mapStateToProps, null) (Version)
