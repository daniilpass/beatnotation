
// Convert an AudioBuffer to a Blob using WAVE representation
export const saveFile = (file, filename) => {
    const a = document.createElement('a');
    a.href= URL.createObjectURL(file);
    a.download = filename;
    //a.innerHTML = filename;
    a.click();    
    //document.body.appendChild(a);
    URL.revokeObjectURL(a.href);
};