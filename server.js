var fs 				= require('fs');
var path            = require('path');
var express 		= require('express');
var app 			= express();
var bodyParser 		= require('body-parser');
var port 			= process.env.PORT || 8080;
var router 			= express.Router();
var ffmpeg 			= require('fluent-ffmpeg');
var request         = require("request");
var multer          = require('multer');
var Busboy          = require('busboy');

// //middleware
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());
app.use('/', express.static(__dirname+'/'));

app.use('/api', router);
router.route('/*')
	.get(function(req, res){
        var url = papi + req.url.split('.com/')[1].split('?')[0];
		request.get(url, {
        'auth': {
            'user': username,
            'pass': password,
            'sendImmediately': false
        }}, function(err, res2, body) {
            res.send(JSON.parse(body));
        });
	})
    .post(function (req, res) {
        var busboy = new Busboy({ headers: req.headers });
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            var saveTo = 'output.mov';
            convertToMOV(file, fs.createWriteStream(saveTo));
        });
        // busboy.on('finish', function() {
        //   res.writeHead(200, { 'Connection': 'close' });
        //   res.end("File uploaded!");
        // });
        var finished = req.pipe(busboy);
    });

var username = 'human';
var password = 'R3plicant';
var papi = 'http://cms-publishapi.prd.nytimes.com/v1/publish/scoop/';

app.listen(port);
console.log('hosting on port ' + port);

function convertToMOV(file, output, callback) {
    ffmpeg(file)
        .format('mp4')
        .outputOptions('-movflags frag_keyframe+empty_moov')
        .on('end', callback)
        .on('error', function(err, stdout, stderr) {
        console.log(err, stdout, stderr);
        })
        .writeToStream(output, {end: true});
}

