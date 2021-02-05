import {SET_REALTIME_RENDER} from '../types'

export const setRealtimeRender = (value) => {
    return {
        type: SET_REALTIME_RENDER,
        payload: {
            realtimeRender: value
        }
    }
}