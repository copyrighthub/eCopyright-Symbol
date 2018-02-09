// Regular experessions to match s0 and s1 hubKeys
const hubKeyS0 = /https:\/\/((?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(?:\.(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*(?::[0-9]{2,5})?)\/(s0)\/((?:[a-zA-Z0-9\\.\\-_~!$&\\'()*+,;=:@]|%[\\da-fA-F]{2})+)\/(asset|offer|creation)\/((?:[a-zA-Z0-9\.\-_~!$&\'()*+,;=:@]|%[\da-fA-F]{2})+)\/((?:[a-zA-Z0-9\.\-_~!$&\'()*+,;=:@]|%[\da-fA-F]{2})+)\/((?:[a-zA-Z0-9\.\-_~!$&\'()*+,;=:@]|%[\da-fA-F]{2})+)/;
const hubKeyS1 = /https:\/\/((?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(?:\.(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*(?::[0-9]{2,5})?)\/(s1)\/((?:[a-zA-Z0-9\\.\\-_~!$&\\'()*+,;=:@]|%[\\da-fA-F]{2})+)\/([0-9a-f]{32})\/(asset|offer|agreement)\/([0-9a-f]{32})/;

// function to put the eCopyright symbol on top of image
function eCopyrightSymbol(link, image) {
    var eCopyright = '<br/><a href="'+link+'" target="_blank"><img style="position: relative; margin-top: -49px; left: 5px; background:rgba(256, 256, 256, 0.75);box-shadow:0 0 5px 5px rgba(256, 256, 256, 0.75)" height=32 width=32 src=http://services.copyrighthub.org/copyrighthubcog32.png /></a>';
    $(eCopyright).insertAfter($(image));
}

// find all images on page and look for hub key of copyright hub data attributes
$(function() {
    // we're going to push images into the page so just get the images there at the start
    images = $("img");
    var matches = [];
    for(i=0;i < images.length;i++){
        var image = images[i];
        // look for data attributes 
        if($(image).attr("data-hubpid") && $(image).attr("data-hubaid") && $(image).attr("data-hubidt")){
            link = 'https://resol.copyrighthub.org/?hubpid='+$(image).attr("data-hubpid")+'&hubidt='+$(image).attr("data-hubidt")+'&hubaid='+$(image).attr("data-hubaid");
            eCopyrightSymbol(link, image);
        } else {
            // look for hub key
            parseImageForIPTC(image);
        }
    }
});


/**
 * Load the image
 *
 * By fetching the image in the background script we avoid issues with
 * cross-site content.
 * @param {string} url - image url
 * @param {function} callback
 */
function getImage(url, callback) {
    if (url.indexOf('http') === 0) {
        var http = new XMLHttpRequest();
        http.onload = function () {
            try {
                if (http.status == '200') {
                    callback(http.response);
                } else {
                    throw new Error('Could not load image');
                }
                http = null;
            } catch (error) {
                console.error(error);
            }
        };
        http.open('GET', url, true);
        http.responseType = 'arraybuffer';
        http.send(null);
    } else {
        blob = dataURItoBlob(url);
        var fileReader = new FileReader();
        fileReader.onload = function() {
            arraybuffer = this.result;
            callback(arraybuffer);
        };
        fileReader.readAsArrayBuffer(blob);
    }
}

/**
 * Searches all iptc fields and returns hubkey
 * hubkey can be substring of longer field
 *
 * @param {object} iptc data
 * @return {string} hubkey
 */
function getHubKey(data) {
    for (let key in data) {
        let value = data[key];
        let matched = hubKeyS1.exec(value);
        if (!matched) {
            matched = hubKeyS0.exec(value);
        }
        if (matched) {
            return matched[0];
        }
    }
    return null;
}

/**
 * Extract an identifier for an image, and process accordingly
 *
 * @param {string} img
 */
function parseImageForIPTC(img){
    getImage(img.src, function (file) {
        var data = findInJPEG(file) || {};
        var hubkey = getHubKey(data);
        if(hubkey){
            eCopyrightSymbol(hubkey, img);
        }
    });
}

/*
IPTC code from exif.js (https://github.com/jseidelin/exif-js).
The MIT License (MIT)
Copyright (c) 2008 Jacob Seidelin
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function findInJPEG(file) {
    var dataView = new DataView(file);

    if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
        return false; // not a valid jpeg
    }

    var offset = 2,
        length = file.byteLength;


    var isFieldSegmentStart = function(dataView, offset){
        return (
            dataView.getUint8(offset) === 0x38 &&
            dataView.getUint8(offset+1) === 0x42 &&
            dataView.getUint8(offset+2) === 0x49 &&
            dataView.getUint8(offset+3) === 0x4D &&
            dataView.getUint8(offset+4) === 0x04 &&
            dataView.getUint8(offset+5) === 0x04
        );
    };

    while (offset < length) {
        if ( isFieldSegmentStart(dataView, offset )){
            // Get the length of the name header (which is padded to an even number of bytes)
            var nameHeaderLength = dataView.getUint8(offset+7);
            if(nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
            // Check for pre photoshop 6 format
            if(nameHeaderLength === 0) {
                // Always 4
                nameHeaderLength = 4;
            }

            var startOffset = offset + 8 + nameHeaderLength;
            var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

            return readIPTCData(file, startOffset, sectionLength);
        }
        // Not the marker, continue searching
        offset++;
    }
}
var IptcFieldMap = {
    0x78 : 'caption',
    0x6E : 'credit',
    0x19 : 'keywords',
    0x37 : 'dateCreated',
    0x50 : 'byline',
    0x55 : 'bylineTitle',
    0x7A : 'captionWriter',
    0x69 : 'headline',
    0x74 : 'copyright',
    0x0F : 'category'
};

function readIPTCData(file, startOffset, sectionLength){
    var dataView = new DataView(file);
    var data = {};
    var fieldValue, fieldName, dataSize, segmentType, segmentSize;
    var segmentStartPos = startOffset;
    while(segmentStartPos < startOffset+sectionLength) {
        if(dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos+1) === 0x02){
            segmentType = dataView.getUint8(segmentStartPos+2);
            if(segmentType in IptcFieldMap) {
                dataSize = dataView.getInt16(segmentStartPos+3);
                segmentSize = dataSize + 5;
                fieldName = IptcFieldMap[segmentType];
                fieldValue = getStringFromDB(dataView, segmentStartPos+5, dataSize);
                // Check if we already stored a value with this name
                if(data.hasOwnProperty(fieldName)) {
                    // Value already stored with this name, create multivalue field
                    if(data[fieldName] instanceof Array) {
                        data[fieldName].push(fieldValue);
                    }
                    else {
                        data[fieldName] = [data[fieldName], fieldValue];
                    }
                }
                else {
                    data[fieldName] = fieldValue;
                }
            }

        }
        segmentStartPos++;
    }
    return data;
}

function getStringFromDB(buffer, start, length) {
    var outstr = "";
    for (n = start; n < start+length; n++) {
        outstr += String.fromCharCode(buffer.getUint8(n));
    }
    return outstr;
}