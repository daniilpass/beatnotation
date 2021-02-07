import {combineReducers} from "redux";
import editor from "./editor"
import canvas from "./canvas"

export default combineReducers({editor, canvas});