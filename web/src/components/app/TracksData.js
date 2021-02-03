import SoundCrash from '../../assets/sounds/crash.mp3';
import SoundRide from '../../assets/sounds/ride.mp3';
import SoundHiHatClosed from '../../assets/sounds/hh_closed.mp3';
import SoundHiHatOpened from '../../assets/sounds/hh_open.mp3';
import SoundSnare from '../../assets/sounds/snare.mp3';
import SoundKick from '../../assets/sounds/kick.mp3';
import SoundTomHi from '../../assets/sounds/tom_hi.mp3';
import SoundTomMid from '../../assets/sounds/tom_mid.mp3';
import SoundTomLow from '../../assets/sounds/tom_low.mp3';

// types
// 1 - cricle
// 2 - cross
// 3 - cross with o
export const tracksData = [
    {
        audioUrl: SoundCrash,
        volume: 0.5,
        takts:[],
        line: 0.5,
        type: 2,
        title: "Crash"
    },
    {
        audioUrl: SoundRide,
        volume: 1,
        takts:[],
        line: 1.5,
        type: 2,
        title: "Ride"
    },
    {
        audioUrl: SoundHiHatClosed, 
        volume: 1,
        takts:[],
        line: 1,
        type: 2,
        title: "Hi-Hat Closed"
    },
    {
        audioUrl: SoundHiHatOpened,
        volume: 1,
        takts:[],
        line: 1,
        type: 3,
        title: "Hi-Hat Open"
    },
    {
        audioUrl: SoundSnare,
        volume: 1,
        takts:[],
        line: 3,
        type: 1,
        title: "Snare"
    },
    {
        audioUrl: SoundTomHi, // tom 2
        volume: 1,
        takts:[],
        line: 2,
        type: 1,
        title: "Tom Hi"
    },
    {
        audioUrl: SoundTomMid,// tom 2
        volume: 1,
        takts:[],
        line: 2.5,
        type: 1,
        title: "Tom Mid"  
    },
    {
        audioUrl: SoundTomLow,//floor tom
        volume: 1,
        takts:[],
        line: 4,
        type: 1,
        title: "Tom Low"  
    },
    {
        audioUrl: SoundKick,
        volume: 1,
        takts:[],
        line: 5,
        type: 1,
        title: "Kick"  
    },
]