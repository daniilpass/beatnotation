import {SET_APP_BUSY} from "../types"

export const setAppBusy = (value, text) => {
    return dispatch => {
        dispatch({
            type: SET_APP_BUSY,
            payload: {
                busy: value,
                text: text
            }
        });
        return Promise.resolve();
     };
    
    //return Promise.resolve();
    // return {
    //     type: SET_APP_BUSY,
    //     payload: {
    //         busy: value
    //     }
    // }
}
