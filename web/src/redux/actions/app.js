import thunk from 'redux-thunk';

import {SET_APP_BUSY} from "../types"

export const setAppBusy = (value) => {
    return dispatch => {
        dispatch({
            type: SET_APP_BUSY,
            payload: {
                busy: value
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
