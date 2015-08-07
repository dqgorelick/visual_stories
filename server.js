var fs 				= require('fs');
var path            = require('path');
var express 		= require('express');
var app 			= express();
var bodyParser 		= require('body-parser');
var port 			= process.env.PORT || 8080;
var router 			= express.Router();
var ffmpeg 			= require('fluent-ffmpeg');
var request         = require("request");
var Busboy          = require('busboy');
var spawn           = require('child_process').spawn;

// //middleware
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());
app.use('/', express.static(__dirname+'/'));
// app.use('/trailers', express.static(__dirname+'/'));

app.use('/api', router);


/* Gifify isn't working to begin with...

var input = path.join(__dirname, 'sample.mp4');
var output = path.join(__dirname, 'mov.gif');
var gif = fs.createWriteStream(output);
gifify(input, {}).pipe(gif);
gif.on('close', function end() {
    console.log('gifified ' + input + ' to ' + output);
});*/

app.post('/convert/2gif', function (req, res) {
    console.log('starting gif conversion');
    var busboy = new Busboy({ headers: req.headers });
    var saveTo = 'tmp.webm';
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        file.pipe(fs.createWriteStream(saveTo));
    });
    busboy.on('finish', function() {
        var output = __dirname + '/out.gif';
        convertToGIF(saveTo, output, function() {
            res.sendFile(output);
        });
    });
    var finished = req.pipe(busboy);
});

app.post('/convert/2mov', function (req, res) {
    console.log('starting file conversion');
    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        res.writeHead(200, {
            "Content-Type": "video/mp4"
        });
        convertToMOV(file, res, function() {
          res.end();
        });
    });
    var finished = req.pipe(busboy);
});

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

function convertToGIF(file, output, callback) {
    var gifify = spawn('./giffify.sh', [file, output]);
    gifify.stdout.on('data', function (data) {    // register one or more handlers
      console.log('stdout: ' + data);
    });

    gifify.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    gifify.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      console.log('done with gif?');
      callback();
    });
}

