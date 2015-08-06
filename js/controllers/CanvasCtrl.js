/*

    THINGS TO ADD

        P2:
        ken burns selection - Dan - DONE
        show the length of the video - Jordan DONE
        show the length of the video - Sam DONE
        populate text from metadata Sam DONE
        preview doesn't work and breaks custom rects for text - Sam DONE

        P3:
        Put it on a server
        Error message if article chosen is interactive or other
        Share buttons

        P4:
        Smarter generation? Algorithm - definitely less images
        push things out of the way
        gif export is slow
        Make it easier to create rectangles

        P5:
        download w/article name as filename.
        add slide change to be save slide.
        quotes with overlays by default
        quotes itext
        automatic align



    BUGS TO FIX:
        P1:
        MAKE FONTS WORK for people testing app on the server - DONE
        Make fonts work for Firefox and Safi as well
        caption on two slides. - DONE
        panning bug - Dan - DONE
        fix timing (account for ken burns & fadeOut) - Dan - DONE
        when you drag, selected shouldn't change - Dan - DONE
        Center text appropriately- DONE
        stop? - DONE?


        P6:
        fix removing. - DONE
        timeline selection/override bugs - DONE
        don't append video on second run through - DONE

*/

angular.module('Canvas', ['AssetService', 'ConfigService', 'TimelineService', 'cfp.hotkeys', 'UploadService']).controller('CanvasCtrl', function($scope, Config, assets, timeline, hotkeys, uploader) {

    $scope.canvas = null;
    $scope.canvas_width = 600;
    $scope.canvas_height = 338;
    $scope.video = null;
    $scope.showCanvas = true;
    $scope.defaultSlides = [];
    $scope.continueRender = true;
    $scope.writingGIF = 0;
    $scope.playing = false;
    $scope.renderedVideo = null;

    $scope.convertToGIF = function() {
        gifshot.createGIF({
            gifWidth: 600,
            gifHeight: 338,
            video: [
                $scope.renderedVideo
            ],
            interval: 20,
            numFrames: 20,
            progressCallback: function(progress) {
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

    $scope.resetVideo = function() {
        $scope.video = new Whammy.Video(15);
    }

    $scope.initialize = function() {
        $scope.canvas = new fabric.Canvas('canvas', {
            backgroundColor: '#000000'
        });
        $scope.resetVideo();
        $scope.undo = [$scope.saveSlide()];
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
    hotkeys.add({
        combo: 'shift+backspace',
        description: 'Clear the canvas',
        callback: function(event) {
            event.preventDefault();
            $scope.clearCanvas();
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
        return img;
    };

    $scope.chooseText = function(string, options, rect, ignoreUndo) {
        options = _.defaults(options || {}, {
            content: string,
            color: '#ffffff',
            font: 'NYTCheltenhamExtBd-Regular',
            fontStyle: 'italic',
            size: 40,
            justify: 'center',
            textAlign: 'center',
            compensateHeightOnWrap: true
        });
        rect = rect || [0, $scope.canvas_height * 2 / 5, $scope.canvas_width, $scope.canvas_height * 3 / 5];
        // x y w h
        var text = $scope.createText(rect, options);
        $scope.canvas.add(text);

        if (!ignoreUndo) $scope.qUndo();
        return text;
    }

    $scope.clearCanvas = function() {
        $scope.canvas.clear();
    };

    $scope.createOverlay = function(rect, options) {
        var rectangle = new fabric.Rect({
            left: rect ? rect[0] : options.left,
            top: rect ? rect[1]: options.top ,
            width: rect ? rect[2] : options.width,
            height: rect ? rect[3] : options.height,
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
            textAlign: options.textAlign,
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
        $scope.renderedVideo = output;
        var link = (window.URL || window.webkitURL).createObjectURL(output);
        if ($scope.player) {
            $scope.player.destroy();
            $('#video-container').append("<div id='nyt-player'></div>");
        }
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

        $scope.resetVideo();
        $scope.showCanvas = false;
        $scope.$apply();
    };

    /***************************
    **   Loading Slides       **
    ***************************/

    $scope.saveSlide = function(){
        var saved = $scope.canvas.toJSON();
        saved = JSON.stringify(saved);
        return saved;
    };

    $scope.lastRestored = -1;

    $scope.restoreSlide = function(index){
        $scope.canvas.clear();
        if ($scope.lastRestored != index){
            $scope.loadSlide(index, function() {
                $scope.canvas.renderAll();
                $scope.qUndo();
            })
            $scope.lastRestored = index;
        } else {
            $scope.lastRestored = -1;
        }

    };


    $scope.loadSlide = function(slide, callback) {
        if (_.isNumber(slide)) {
            slide = timeline.slides[slide];
        }
        $scope.canvas.loadFromJSONWithoutClearing(slide.json, function() {
            callback ? callback() : $scope.canvas.renderAll();
            $scope.centerText();
        });
    };

    $scope.centerText = function(horizontal) {
        objects = $scope.canvas.getObjects();
        texts = _.each(objects, function(obj) {
            if (obj.type == 'text') {
                if (obj.__textAlign === 'center') {
                    obj.centerH();
                }
            }
        });
    }

    /***************************
    **  Creating Slides       **
    ***************************/

    $scope.createStarterSlide = function() {
        $scope.chooseImage("starter", true);
        var starter = Config.defaultSlide($scope.saveSlide());
        starter.duration = 1500;
        starter.fadeIn = 1000;
        starter.fadeOut = 0;
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
            justify: 'left',
            textAlign: 'left',
        };
        var bylinePosition = [20, $scope.canvas_height * 9 / 10, $scope.canvas_width, $scope.canvas_height * 1 / 10];

        $scope.chooseText(headline, headlineStyle, headlinePosition, true);
        $scope.chooseText(byline, bylineStyle, bylinePosition, true);
        var headliner = Config.defaultSlide($scope.saveSlide());
        headliner.fadeIn = 1000;
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
                size: 21
            };
            var summaryPosition = [0, $scope.canvas_height * .75, $scope.canvas_width, $scope.canvas_height * .25];
            var summaryOverlay = new fabric.Rect({
                left: 0,
                top: $scope.canvas_height * 7 / 10,
                fill: "#000000",
                opacity: 0.5,
                width: $scope.canvas_width,
                height: $scope.canvas_height * 3 / 10
            });

            $scope.canvas.add(summaryOverlay);
            var text = $scope.chooseText(caption, summaryStyle, summaryPosition, true);
            $scope.moveToBottom(text);
        }

        var imageSlide = Config.defaultSlide($scope.saveSlide());
        imageSlide.kenBurns = effects.kenBurns;
        $scope.clearCanvas();
        return imageSlide;
    }

    $scope.moveToBottom = function(text) {
        var rect = text.getBoundingRect();
        var pos = Math.round($scope.canvas_height - rect.height) - 10;
        text.top = pos;
        $scope.canvas.renderAll();
    }

    $scope.generateEndingSlide = function() {
        $scope.chooseImage("ender", true);
        var ender = Config.defaultSlide($scope.saveSlide());
        ender.kenBurns = 0;
        ender.duration = 1500;
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

            for (var it = 0; it < numImages; it++) {
                var effects = {kenBurns: it%6+1}
                var caption = (it == 0) ? summary : null;
                var slide = $scope.generateImageSlide('image' + it, caption, effects);
                timeline.slides.push(slide);
            }

            timeline.slides.push($scope.generateEndingSlide());
            $scope.$broadcast('addSlide');
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

        $scope.loadSlide(currentSlide,
            _.partial((currentSlide.duration ? $scope.fade : nop), false, currentSlide,
            _.partial(currentSlide.fadeOut ? $scope.fade : nop, true, currentSlide, nextSlide)));
    };

    $scope.playSlides = function(recording) {
        $scope.clearCanvas();
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
        var trueDuration = slide.duration - slide.fadeOut
        var animation = $scope.createAnimation(slide, obj, trueDuration);

        obj.animate(animation, {
            onChange: $scope.canvas.renderAll.bind($scope.canvas),
            duration: trueDuration,
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

    $scope.createAnimation = function(slide, obj, duration) {
        var animation = {};
        if (slide.fadeIn) {
            obj.opacity = 0;
            animation['opacity'] = duration / slide.fadeIn;
        }
        switch (slide.kenBurns) {
            case 0:
                animation["scaleX"] = obj.scaleX;
                break;
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


    /***************************
    **Download And Convert    **
    ***************************/
    $scope.downloadMov = function() {
        uploader.uploadFileToUrl($scope.renderedVideo, '/convert/2mov')
        .then(function(response) {
          downloadFile(response.data, 'sup.mov');
        });
    };

    $scope.downloadWebM = function() {
        downloadFile($scope.renderedVideo, 'sup.webm');
    };

    $scope.downloadGIF = function() {
        uploader.uploadFileToUrl($scope.renderedVideo, '/convert/2gif')
        .then(function(response) {
          downloadFile(response.data, 'sup.gif');
        });
    };

});
