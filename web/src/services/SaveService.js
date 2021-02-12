class SaveService {

    constructor() {

        window.ctb = this.charToUint8Array;
        window.ltb = this.longToByteArray;
        window.btl = this.byteArrayToLong;
    }
    

    createSaveFile = (data) => {
        //TODO: improve data to save (add app version)
        // progress
        // mb optimization
        let resultArray = [];
        let startIndex = 0;
        let longLength = 8;
        let streamIndex = startIndex + longLength; // Первые 8 бит под адрес json

        // Прохожу по всем трекам, записываю в результат аудио буферы и указываю их указатели и длину в JSON
        for (let trackIndex = 0; trackIndex < data.tracks.length; trackIndex++) {
            let _track = data.tracks[trackIndex];
            // Кодирую музыку
            if (_track.type === 0 && !!_track.arrayBuffer) {
                // Звук в виде массива
                let audioBuffer = Array.from(new Uint8Array(_track.arrayBuffer));

                // В JSON записываю указатель на буфер
                _track.arrayBufferPointer = streamIndex;
                _track.arrayBufferLength = audioBuffer.length;

                // Запись в результирующий массив                
                for (let i = 0; i < audioBuffer.length; i++) {
                    resultArray[streamIndex] = audioBuffer[i];
                    streamIndex++;
                }
            }
        }

        // JSON с данными и заполненными указателями
        let jsonString = JSON.stringify(data)

        // Кодирую JSON       
        let encode = this.stringToUint8Array(jsonString);
        //let decode = this.uint8ArrayToString(encode, 0, encode.length);

        // Записываю JSON в конец буфера
        let jsonPointer = streamIndex;   
        for (let i = 0; i < encode.length; i++) {
            resultArray[streamIndex] = encode[i]; 
            streamIndex++;           
        }

        // В самое  начало буфера записываю указатель на JSON
        let jsonPointerBytes = this.longToByteArray(jsonPointer);
        for (let i = startIndex; i < longLength; i++) {
            resultArray[i] = jsonPointerBytes[i];            
        }



        let buffer = new ArrayBuffer(resultArray.length);
        let view = new Uint8Array(buffer);
        for (let i = 0; i < resultArray.length; i++) {
            view[i] = resultArray[i];            
        }

        return buffer;
    }

    readSaveFile = (arrayBuffer) => {
        // Представление буфера
        let view = new Uint8Array(arrayBuffer);

        // Считываю указатель на JSON
        let jsonPointer = this.byteArrayToLong(view.slice(0,8))

        // Считываю JSON
        let jsonBuffer = view.slice(jsonPointer);
        let jsonString = this.uint8ArrayToString(jsonBuffer, 0, jsonBuffer.length);

        // json to object
        let data = JSON.parse(jsonString);

        //Заполняю ArrayBuffer аудио дорожке
        for (let i = 0; i < data.tracks.length; i++) {
            let _track = data.tracks[i];
            if (_track.type === 0 && !!_track.arrayBufferLength && !!_track.arrayBufferPointer) {
                _track.arrayBuffer = view.slice(_track.arrayBufferPointer, _track.arrayBufferPointer + _track.arrayBufferLength)
            }
        }

        //return
        return data;
    }

    uint8ArrayToString = (byteArray, start, end) => {
        var str = "";
        var value = 0;
        for ( var i = start; i <= end - 1; i++) {
            value = (value * 256) + byteArray[i];

            if ( i % 2 === 1) {                
                str += String.fromCharCode(value);
                value = 0;
            }
        }
        return str;
    }

    stringToUint8Array = (str) => {
        var byteArray = [];
        for (let index = 0; index < str.length; index++) {
            const charCode = str.charCodeAt(index);
            const charInUint8Array = this.charToUint8Array(charCode);
            byteArray.push(...charInUint8Array);
        }
        return byteArray;
    }

    charToUint8Array = (char) => {
        if ( char > 65535)
            throw new Error("Buffer overflow");

        var byteArray = [];
        var byte = char & 0xff;
        byteArray[1] = byte; //1
        byteArray[0] = ( (char - byte) / 256 ) & 0xff; //0
        return byteArray;
    }

    longToByteArray = function(long) {
        var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

        for ( var index = byteArray.length - 1; index >= 0; index--) {
            var byte = long & 0xff;      // 300 - 44
            byteArray[index] = byte; 
            long = (long - byte) / 256 ;
        }

        return byteArray;
    }

    byteArrayToLong = function(byteArray) {
        var value = 0;
        for ( var i = 0; i <= byteArray.length - 1; i++) {
            value = (value * 256) + byteArray[i];
        }

        return value;
    };

}

export default new SaveService();