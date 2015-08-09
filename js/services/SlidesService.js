angular.module('SlidesService', []).factory('slides', [function() {

    var slides = [];

    var getDisplayTime = function() {
        return getTime() / 1000 + ' seconds';
    };

    var getTime = function() {
        return time = _.reduce(slides, function(memo, slide) {
            return memo + slide.duration;
        }, 0);
    };

    var removeSlide = function(index) {
        slides.splice(index, 1);
    };

    var swap = function(first, next) {
        var tmp = slides[first];
        slides[next] = tmp;
        slides[first] = tmp;
    };

    return {
        slides: slides,
        removeSlide: removeSlide,
        getTime: getTime,
        getDisplayTime: getDisplayTime,
        swap: swap,
        selected: null,
    };

}]);
