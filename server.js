var fs 				= require('fs');
var express         = require('express');
var app 			= express();
var port 			= process.env.PORT || 8080;
var api             = require('./api');

// //middleware
app.use('/', express.static(__dirname+'/'));
// app.use('/trailers', express.static(__dirname+'/'));

app.use('/api', api);

app.listen(port);
console.log('hosting on port ' + port);