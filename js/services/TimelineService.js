angular.module('TimelineService', []).factory('timeline', [function() {

    var slides = [];
    var active = [];

    var videoDuration = function(){
        var time = 0;
        slides.forEach(function(slide){
            time += slide.duration;
        })
        console.log(time);
        return time;
    }

    return {
        slides: slides,
        videoDuration: videoDuration
    }
}]);
