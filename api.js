var fs              = require('fs');
var express         = require('express');
var router          = express.Router();
var Busboy          = require('busboy');
var papi            = require('./papi.js');
var convert         = require('./convert.js');

//All get requests proxy to papi.
router.route('/*').get(function(req, res){
    papi.proxy(req.url, function(response) {
        res.send(response);
    });
});

router.route('/convert/2gif').post(function(req, res) {
    var busboy = new Busboy({ headers: req.headers });
    var saveTo = 'tmp.webm';
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        file.pipe(fs.createWriteStream(saveTo)); //Save to a file.
    });
    busboy.on('finish', function() {
        var output = __dirname + '/out.gif';
        convert.toGIF(saveTo, output, function() {
            console.log('d!');
            res.download(output, 'out.gif');
        });
    });

    req.pipe(busboy);
});

router.route('/convert/2mov').post(function(req, res) {
    console.log('starting file conversion');
    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        res.writeHead(200, {
            "Content-Type": "video/mp4"
        });
        convert.toMOV(file, res, function() {
          res.end();
        });
    });
    var finished = req.pipe(busboy);
});

module.exports = router;