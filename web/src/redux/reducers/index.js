import {combineReducers} from "redux";
import editor from "./editor"
import canvas from "./canvas"
import loader from "./loader"
import app from "./app"

export default combineReducers({editor, canvas, loader, app});