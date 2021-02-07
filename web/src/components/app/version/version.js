import React from "react";

import styles from './version.module.css';
export default class Version extends React.PureComponent {  
  
  /*Major.Minor.Fixes*/
  render() {
    return <div className={styles['app-ver'] + " no-print"}>{this.props.value}</div>  
  }
}