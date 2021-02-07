import {combineReducers} from "redux";
import editor from "./editor"
import canvas from "./canvas"
import loader from "./loader"

export default combineReducers({editor, canvas, loader});