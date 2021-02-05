import React from "react";

import styles from './header.module.css';

export default class Header extends React.PureComponent { 
    
  render() {
    return <header className={styles.header + " no-print"}>
        Beat Notation
    </header>
  }
}