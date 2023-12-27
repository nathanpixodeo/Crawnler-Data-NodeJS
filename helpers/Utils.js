var fs = require('fs');

const imageToBase64 = (file) => {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString('base64');
}

module.exports = { imageToBase64 }