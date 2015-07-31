/*

    THINGS TO ADD

        P2:
        ken burns selection - Dan
        show the length of the video - Sam
        preview doesn't work and breaks custom rects for text - Sam

        P3:
        Smarter generation? Algorithm
        push things out of the way
        gif export is slow
        Make it easier to create rectangles

    BUGS TO FIX:
        P1:
        caption on two slides. - Sam
        panning bug - Dan
        fix timing (account for ken burns & fadeOut) - Dan
        when you drag, selected shouldn't change - Dan
        stop? -
*/

angular.module('Canvas', ['AssetService', 'ConfigService', 'TimelineService', 'cfp.hotkeys']).controller('CanvasCtrl', function($scope, Config, assets, timeline, hotkeys) {

    $scope.canvas = null;
    $scope.canvas_width = 600;
    $scope.canvas_height = 337.5;
    $scope.video = null;
    $scope.showCanvas = true;
    $scope.defaultSlides = [];
    $scope.continueRender = true;
    $scope.writingGIF = 0;
    $scope.playing = false;


    $scope.convertToGIF = function(){
        gifshot.createGIF({
            gifWidth: 600,
            gifHeight: 338,
            video: [
                $('#download-link').attr('href')
            ],
            interval: 20,
            numFrames: 20,
            progressCallback: function(progress) {
                console.log(progress);
                $scope.writingGIF = progress * 100;
                $scope.$apply();
            }
        }, function (obj) {
            if (!obj.error) {
                $scope.writingGIF = 0;
                var image = obj.image, animatedImage = document.createElement('img');
                animatedImage.src = image;
                $("#finished").append(animatedImage);
            }
        });
    };

    $scope.initialize = function() {
        $scope.canvas = new fabric.Canvas('canvas', {
            backgroundColor: '#000000'
        });
        $scope.undo = [$scope.saveSlide()];
        $scope.video = new Whammy.Video(15);
        $scope.$on('assets:ready', _.once($scope.createSlides));
    };

    $scope.qUndo = function(){
        var saved = $scope.saveSlide();
        if (saved !== $scope.undo[$scope.undo.length - 1]) {
            $scope.undo.push(saved);
        }
    };

    $scope.popUndo = function(){
        $scope.undo.pop();
        $scope.canvas.loadFromJSON($scope.undo[$scope.undo.length-1], $scope.canvas.renderAll.bind($scope.canvas));
        if ($scope.undo.length === 0) {
            $scope.canvas.clear();
            $scope.qUndo();
        }
    };

    hotkeys.add({
        combo: 'command+z',
        description: 'Undo the last action.',
        callback: $scope.popUndo
    });
    hotkeys.add({
        combo: 'space',
        description: 'Play / Pause',
        callback: function(event) {
            if ($scope.playing) {
                $scope.stop();
            } else {
                $scope.playSlides();
            }
            event.preventDefault();
        }
    });
    hotkeys.add({
        combo: 'backspace',
        description: 'Delete the selected object',
        callback: function(event) {
            event.preventDefault();
            $scope.deleteSelected();
        }
    });

    $scope.deleteSelected = function() {
        var obj = $scope.canvas.getActiveObject();
        if (obj) {
            obj.remove();
            $scope.qUndo();
        }
    }

    $scope.chooseImage = function(id, ignoreUndo) {
        $scope.clearCanvas();
        var img = new fabric.Image(id);
        var ratioX = $scope.canvas.width / img.width;
        var ratioY = $scope.canvas.height / img.height;
        if (ratioX > ratioY){
            img.width = $scope.canvas.width;
            img.height = img.height * ratioX;
        } else {
            img.width = img.width * ratioY;
            img.height = $scope.canvas.height;
        }
        $scope.canvas.add(img);
        if(!ignoreUndo) $scope.qUndo();
    };

    $scope.chooseText = function(string, options, rect, ignoreUndo) {
        options = _.defaults(options || {}, {
            content: string,
            color: '#ffffff',
            font: 'NYTCheltenhamExtBd',
            fontStyle: 'italic',
            size: 40,
            justify: 'center',
            compensateHeightOnWrap: true
        });
        rect = rect || [0, $scope.canvas_height * 2 / 5, $scope.canvas_width, $scope.canvas_height * 3 / 5];
        // x y w h
        var text = $scope.createText(rect, options);
        $scope.canvas.add(text);
        if (!ignoreUndo) $scope.qUndo();
    }

    $scope.clearCanvas = function() {
        $scope.canvas.clear();
    };

    $scope.createOverlay = function(rect, options) {
        var rectangle = new fabric.Rect({
            left: rect[0],
            top: rect[1],
            width: rect[2],
            height: rect[3],
            fill: options.overlayColor,
            opacity: options.opacity || 1
        });
        return rectangle;
    };

    $scope.createText = function(rect, options) {
        var text = new fabric.Text(options.content, {
            left: rect[0],
            top: rect[1],
            opacity: 1,
            fontFamily: options.font,
            fontSize: options.size,
            fontStyle: options.fontStyle,
            originY:'top',
            originX:'left',
            fill: options.color
        });

        if (rect[2] && rect[3]) {
            var wrapOptions = {
                maxW: rect[2],
                maxH: rect[3],
                justify: options.justify,
                compensateHeightOnWrap: options.compensateHeightOnWrap
            };
            return wrapCanvasText(text, $scope.canvas, wrapOptions);
        }
        return text;
    };

    $scope.drawAll = function() {
        var configs = Config.get();
        if (!_.some(configs.position)) {
            alert("Must at least select a top left corner for text");
            return;
        }

        if (configs.overlay.enabled) {
            $scope.canvas.add($scope.createOverlay(configs.position, configs.overlay));
        }

        if (configs.text) {
            var text = $scope.createText(configs.position, configs.text);
            $scope.canvas.add(text);
        }
    };

    /***************************
    **        Video           **
    ***************************/
    $scope.addFrame = function() {
        $scope.video.add($scope.canvas.getContext("2d"),30);
        if ($scope.continueRender) {
            requestAnimationFrame($scope.addFrame);
        }
    };

    $scope.finalizeVideo = function() {
        var output = $scope.video.compile();
        var link = webkitURL.createObjectURL(output);
        if ($scope.player) {
            $scope.player.destroy();
            $('#video-container').append("<div id='nyt-player'></div>");
        }
        $('#download-link').attr('href', link);
        $scope.player = VHS.player({
            container: 'nyt-player',
            analytics: false,
            id: 123567890,
            ads: false,
            name: 'nyt-trailer',
            src: link,
            api: false,
            autoplay: true,
            mode: "html5"
        });
        $scope.showCanvas = false;
        $scope.$apply();
    };

    /***************************
    **   Loading Slides       **
    ***************************/
    $scope.lastChosen = -1;

    $scope.saveSlide = function(){
        var saved = $scope.canvas.toJSON();
        saved = JSON.stringify(saved);
        return saved;
    };

    $scope.restoreSlide = function(index){
        $scope.loadSlide(index, function() {
            $scope.canvas.renderAll();
            $scope.qUndo();
        })
        $scope.lastChosen = index;
    };


    $scope.loadSlide = function(indexOrData, callback){
        if (_.isNumber(indexOrData)) {
            indexOrData = timeline.slides[indexOrData].json;
        }
        $scope.canvas.loadFromJSONWithoutClearing(indexOrData, callback ? callback : $scope.canvas.renderAll.bind($scope.canvas));
    };

    /***************************
    **  Creating Slides       **
    ***************************/
    $scope.addSlide = function(){
        var data = Config.defaultSlide($scope.saveSlide());
        if($scope.lastChosen >= 0) {
            timeline.slides[$scope.lastChosen] = data;
        } else {
            timeline.slides.push(data);
        }
        $scope.lastChosen = -1;
    };

    $scope.createStarterSlide = function() {
        $scope.chooseImage("starter", true);
        var starter = Config.defaultSlide($scope.saveSlide());
        starter.duration = 1000;
        starter.fadeOut = true;
        starter.kenBurns = 0;
        $scope.canvas.clear();
        return starter;

        // $scope.defaultSlides.push({
        //     name: "starter",
        //     url: $("#starter").attr("src"),
        // });
    }

    $scope.createHeadlineSlide = function(headline, byline) {
        var headlineStyle = {
            fontStyle: 'italic',
            size: 40
        };
        var headlinePosition = [0, $scope.canvas_height * 2 / 5, $scope.canvas_width, $scope.canvas_height * 3 / 5];

        var bylineStyle = {
            fontStyle: 'normal',
            size: 12,
            justify: 'left'
        };
        var bylinePosition = [20, $scope.canvas_height * 9 / 10, $scope.canvas_width, $scope.canvas_height * 1 / 10];

        $scope.chooseText(headline, headlineStyle, headlinePosition, true);
        $scope.chooseText(byline, bylineStyle, bylinePosition, true);
        var headliner = Config.defaultSlide($scope.saveSlide());
        headliner.kenBurns = 0;
        $scope.clearCanvas();
        return headliner;

        // $scope.defaultSlides.push({
        //     name: "headliner",
        //     url: document.getElementById("canvas").toDataURL("image/png"),
        // });
    }

    $scope.generateImageSlide = function(image, caption, effects) {
        $scope.chooseImage(image, true);

        if (caption) {
            var summaryStyle = {
                fontStyle: 'normal',
                size: 21,
            };
            var summaryPosition = [0, $scope.canvas_height * 7 / 10, $scope.canvas_width, $scope.canvas_height * 3 / 10];
            var summaryOverlay = new fabric.Rect({
                left: 0,
                top: $scope.canvas_height * 7 / 10,
                fill: "#000000",
                opacity: 0.5,
                width: $scope.canvas_width,
                height: $scope.canvas_height * 3 / 10
            });

            $scope.canvas.add(summaryOverlay);
            $scope.chooseText(caption, summaryStyle, summaryPosition, true);
        }

        var imageSlide = Config.defaultSlide($scope.saveSlide());

        imageSlide.kenBurns = effects.kenBurns;
        $scope.clearCanvas();
        return imageSlide;
    }

    $scope.generateEndingSlide = function() {
        $scope.chooseImage("ender", true);
        var ender = Config.defaultSlide($scope.saveSlide());
        ender.kenBurns = 0;
        $scope.clearCanvas();
        return ender;

        // $scope.defaultSlides.push({
        //     name: "ender",
        //     url: $("#ender").attr("src"),
        // });
    }

    $scope.createSlides = function() {
        assets.getData().then(function(loaded) {

            timeline.slides.push($scope.createStarterSlide());
            var headline = _.findWhere(loaded.metadata, {name: 'Headline'}).text;
            var byline = _.findWhere(loaded.metadata, {name: 'Byline'}).text;
            timeline.slides.push($scope.createHeadlineSlide(headline, byline));


            var summary = _.findWhere(loaded.metadata, {name: 'Summary'}).text;

            var MAX_NUMBER_OF_IMAGES = 5;
            var numImages = Math.min(loaded.images.length, MAX_NUMBER_OF_IMAGES);
            var MAX_KEN_BURNS = 2;

            for (var i = 0; i < numImages; i++) {
                var effects = i < MAX_KEN_BURNS ? {kenBurns: i} : {};
                var caption = (i == 0) ? summary : null;
                var slide = $scope.generateImageSlide('image' + i, caption, effects);
                timeline.slides.push(slide);
            }

            timeline.slides.push($scope.generateEndingSlide());
            $scope.$broadcast('newSlides');
        });
    };

    /***************************
    **    Animate Slide       **
    ***************************/

    $scope.stop = function(){
        $scope.playing = false;
        $scope.canvas.clear();
    };

    $scope.playSlide = function(index, nextSlide) {
        var currentSlide = timeline.slides[index];
        var nop = function(x, y, cb) {cb()};

        $scope.loadSlide(currentSlide.json,
            _.partial((currentSlide.duration ? $scope.fade : nop), false, currentSlide,
            _.partial(currentSlide.fadeOut ? $scope.fade : nop, true, currentSlide, nextSlide)));
    };

    $scope.playSlides = function(recording) {
        $scope.continueRender = true;
        var currentSlide = -1;
        $scope.playing = true;

        var changeSlide = function() {
            currentSlide++;
            if ($scope.playing && currentSlide < timeline.slides.length) {
                $scope.playSlide(currentSlide, changeSlide);
            } else {
                $scope.continueRender = false;
                if (recording) {
                    $scope.finalizeVideo();
                }
                $scope.playing = false;
                $scope.$apply();
            }
        };

        if (recording) {
            $scope.addFrame();
        }

        changeSlide();
    };

    $scope.fade = function(out, slide, onComplete) {
        if (!$scope.playing) return;

        if (out) {
            $scope.fadeOut(slide, onComplete);
        } else {
            $scope.fadeIn(slide, onComplete);
        }
    };

    $scope.fadeIn = function(slide, onComplete) {
        if (!$scope.playing) return;

        var obj = $scope.canvas._objects[0];
        if (!obj) return;

        var animation = $scope.createAnimation(slide, obj);

        obj.animate(animation, {
            onChange: $scope.canvas.renderAll.bind($scope.canvas),
            duration: slide.duration,
            onComplete: onComplete,
            abort: function() {return !$scope.playing;}
        });
    };

    $scope.fadeOut = function(slide, onComplete) {
        var obj = $scope.canvas._objects[0];
        if (!obj) return;
        obj.opacity = 1;
        obj.animate('opacity', 0, {
            onChange: $scope.canvas.renderAll.bind($scope.canvas),
            duration: slide.fadeOut,
            onComplete: onComplete,
            abort: function() {return !$scope.playing;}
        });
    };

    $scope.createAnimation = function(slide, obj) {
        var animation = {};
        if (slide.fadeIn) {
            obj.opacity = 0;
            animation['opacity'] = slide.duration / slide.fadeIn;
        }
        switch (slide.kenBurns) {
            case 1:
                // zoom in, slide to the left/down
                var scale = 0.1;
                animation['left'] = obj.getLeft() - 10;
                animation['top'] = obj.getTop() - 25;
                animation['scaleX'] = (obj.scaleX + scale);
                animation['scaleY'] = (obj.scaleY + scale);
                break;
            case 2:
                // panning left/up w/o zoom
                var scale = 0.25;
                obj.scaleX = (obj.scaleX + scale);
                obj.scaleY = (obj.scaleY + scale);
                obj.top = -75;
                obj.left = -100;
                animation['left'] = obj.getLeft()+100;
                animation['top'] = obj.getTop()+20;
                break;
            case 3:
                // zoom into center
                var scale = 0.1;
                animation['top'] = (obj.height*(obj.scaleY) - obj.height*(obj.scaleY + scale)) / 2;
                animation['left'] = (obj.width*(obj.scaleX) - obj.width*(obj.scaleX + scale)) / 2;
                animation['scaleX'] = (obj.scaleX + scale);
                animation['scaleY'] = (obj.scaleY + scale);
                break;
            case 4:
                // panning right w/o zoom
                var scale = 0.25;
                obj.scaleX = (obj.scaleX + scale);
                obj.scaleY = (obj.scaleY + scale);
                obj.top = -75;
                obj.left = 0;
                animation['left'] = -100;
                break;
            case 5:
                // zoom into center
                var scale = 0.1;
                animation['left'] = (obj.width * obj.scaleX - obj.width * (obj.scaleX + scale)) / 2;
                animation['scaleX'] = obj.scaleX + scale;
                animation['scaleY'] = obj.scaleY + scale;
                break;
            default:
                animation["scaleX"] = obj.scaleX;
                break;
        }

        return animation;
    };
});
