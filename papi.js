var request         = require("request");
var username        = 'human';
var password        = 'R3plicant';
var route           = 'http://cms-publishapi.prd.nytimes.com/v1/publish/scoop/';

function proxy(url, callback) {
    var papiURL = route + url.split('.com/')[1].split('?')[0];
    request.get(papiURL, {
    'auth': {
        'user': username,
        'pass': password,
        'sendImmediately': false
    }}, function(err, res2, body) {
        callback(JSON.parse(body));
    });
}

module.exports = {
    proxy: proxy,
    route: route
};