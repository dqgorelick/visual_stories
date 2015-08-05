var app = angular.module ('timesTrailer',
    ['Assets',
     'Editor',
     'Canvas',
     'Article',
     'Timeline',
     'ConfigService',
     'TimelineService',
     'AssetService',
     'ngDragDrop',
     'cfp.hotkeys',
     'UploadService']);

app.directive("scroll", function ($window) {
    return function($scope, element, attrs) {
        var eltWidth = 200;
        var index = 0;
        angular.element(element).bind("scroll", function(event) {
            var newIndex = Math.round(this.scrollLeft / eltWidth);
            if (newIndex != index) {
                index = newIndex;
            }
        });
    };
});
app.directive('imageonload', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('load', function() {
                    scope.$apply(attrs.imageonload);
                });
            }
        };
    })