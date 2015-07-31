angular.module('Timeline', ['TimelineService', 'cfp.hotkeys']).controller('TimelineCtrl', function($scope, timeline, hotkeys) {
    var count = localStorage.length;
    $scope.slides = [];
    $scope.expandTimeline = false;
    $scope.time = '0 seconds';

    $scope.getTime = function() {
        var time = _.reduce($scope.slides, function(memo, slide) {
            return memo + slide.duration;
        }, 0);
        $scope.time = time / 1000 + ' seconds';
    }

    hotkeys.add({
        combo: 't',
        description: 'Show or hide the timeline.',
        callback: function() {
            $scope.expandTimeline = !$scope.expandTimeline;
        }
    });

    $scope.save = function() {
        localStorage.setItem(count, count);
        count++;
    };
    $scope.load = function() {
        localStorage.getItem("example");
        count++;
    };
    $scope.clear = function() {
        localStorage.clear();
    };

    $scope.$on("newSlides", function(){
        $scope.fillSlides();
    })

    $scope.durations = [
        {value: 500, label: '0.5 secs'},
        {value: 1000, label: '1 sec'},
        {value: 1500, label: '1.5 secs'},
        {value: 2000, label: '2 secs'},
        {value: 2500, label: '2.5 secs'},
        {value: 3000, label: '3 secs'}
    ];

    $scope.effects = [
        {value: 0, label: 'NO PANNING'},
        {value:  1, label: 'ZOOM & SLIDE'},
        {value:  2, label: 'PAN LEFT & UP'},
        {value:  3, label: 'ZOOM CENTER'},
        {value:  4, label: 'PANNING RIGHT'},
        {value:  5, label: 'PANNING LEFT'}
    ];

    $scope.fillSlides = function() {
        $scope.slides = timeline.slides;
        if ($scope.slides.length) {
            $scope.expandTimeline = true;
        }
        $scope.getTime();
    };

    $scope.randomKen = function (slide) {
        slide.kenBurns = Math.ceil(Math.random() * 5);
    };

    $scope.removeSlide = function(index){
    	timeline.slides.splice(index, 1);
        $scope.getTime();
    }

    $scope.effectIndex = -1;
    $scope.effectShow = function(index){
    	if(index == $scope.effectIndex){
    		$scope.effectIndex = -1
    	} else {
    		$scope.effectIndex = index;
    	}
    };


    this.dropCallback = function(event, ui, title, $index) {
        console.log("worked");
    };
});
