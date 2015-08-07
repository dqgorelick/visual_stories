var ffmpeg          = require('fluent-ffmpeg');
var spawn           = require('child_process').spawn;

function toMOV(fileStream, outputStream, callback) {
    ffmpeg(fileStream)
        .format('mp4')
        .outputOptions('-movflags frag_keyframe+empty_moov')
        .on('end', callback)
        .on('error', function(err, stdout, stderr) {
            console.log(err, stdout, stderr);
        })
        .writeToStream(outputStream, {end: true});
}

function toGIF(fileName, outputName, callback) {
    var gifify = spawn('./giffify.sh', [fileName, outputName]);
    gifify.stdout.on('data', function (data) {    // register one or more handlers
      console.log('stdout: ' + data);
    });

    gifify.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    gifify.on('exit', function (code) {
      console.log('gif process exited with code ' + code);
      callback(code);
    });
}

module.exports = {
  toGIF: toGIF,
  toMOV: toMOV
};