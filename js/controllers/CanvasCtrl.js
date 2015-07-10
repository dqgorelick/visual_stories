angular.module('Canvas', ['ConfigService']).controller('CanvasCtrl', function($scope, Config) {
    $scope.canvas = null;
    $scope.canvas_width = 600;
    $scope.canvas_height = 400;
    $scope.video = null;


    $scope.initialize = function() {
        $scope.canvas = new fabric.Canvas('canvas');
        $scope.video = new Whammy.Video(15);
    }

    $scope.addFrame = function() {
        $scope.video.add($scope.canvas.getContext("2d"), 3000);
    }

    $scope.finalizeVideo = function() {
        var output = $scope.video.compile();
        var url = webkitURL.createObjectURL(output);
        document.getElementById('awesome').src = url; //toString converts it to a URL via Object URLs, falling back to DataURL
        document.getElementById('download-link').href = url;
    }

    $scope.chooseImage = function(type, id) {
        $scope.clearCanvas();
        var img = new fabric.Image(type + id);
        img.set({
            selectable: false,
            scaleY: $scope.canvas.height / img.height,
            scaleX: $scope.canvas.width / img.width
        });
        $scope.canvas.add(img);
    }

    $scope.clearCanvas = function() {
        $scope.canvas.clear();
    }

    $scope.createOverlay = function(rect, options) {
        var rectangle = new fabric.Rect({
            left: rect[0],
            top: rect[1],
            width: rect[2],
            height: rect[3],
            fill: options.color,
            opacity: options.opacity
        });
        return rectangle;
    }

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
            return wrapCanvasText(text, $scope.canvas, rect[2], rect[3], options.justify);
        }
        return text;
    }

    $scope.drawAll = function() {
        var configs = Config.get();
        console.log(configs);

        if (!_.some(configs.position)) {
            alert("Must at least select a top left corner for text");
            return;
        }

        if (configs.overlay) {
            $scope.canvas.add($scope.createOverlay(configs.position, configs.overlay.enabled));
        }

        if (configs.text) {
            var text = $scope.createText(configs.position, configs.text);
            console.log($scope.canvas);
            $scope.canvas.add(text);
        }

    }

});

function wrapCanvasText(t, canvas, maxW, maxH, justify) {

    if (typeof maxH === "undefined") {
        maxH = 0;
    }
    var words = t.text.split(" ");
    var formatted = '';

    // This works only with monospace fonts
    justify = justify || 'left';

    // clear newlines
    var sansBreaks = t.text.replace(/(\r\n|\n|\r)/gm, "");
    // calc line height
    var lineHeight = new fabric.Text(sansBreaks, {
        fontFamily: t.fontFamily,
        fontSize: t.fontSize
    }).height;

    // adjust for vertical offset
    var maxHAdjusted = maxH > 0 ? maxH - lineHeight : 0;
    var context = canvas.getContext("2d");


    context.font = t.fontSize + "px " + t.fontFamily;
    var currentLine = '';
    var breakLineCount = 0;

    n = 0;
    while (n < words.length) {
        var isNewLine = currentLine == "";
        var testOverlap = currentLine + ' ' + words[n];

        // are we over width?
        var w = context.measureText(testOverlap).width;

        if (w < maxW) { // if not, keep adding words
            if (currentLine != '') currentLine += ' ';
            currentLine += words[n];
            // formatted += words[n] + ' ';
        } else {

            // if this hits, we got a word that need to be hypenated
            if (isNewLine) {
                var wordOverlap = "";

                // test word length until its over maxW
                for (var i = 0; i < words[n].length; ++i) {

                    wordOverlap += words[n].charAt(i);
                    var withHypeh = wordOverlap + "-";

                    if (context.measureText(withHypeh).width >= maxW) {
                        // add hyphen when splitting a word
                        withHypeh = wordOverlap.substr(0, wordOverlap.length - 2) + "-";
                        // update current word with remainder
                        words[n] = words[n].substr(wordOverlap.length - 1, words[n].length);
                        formatted += withHypeh; // add hypenated word
                        break;
                    }
                }
            }
            while (justify == 'right' && context.measureText(' ' + currentLine).width < maxW)
            currentLine = ' ' + currentLine;

            while (justify == 'center' && context.measureText(' ' + currentLine + ' ').width < maxW)
            currentLine = ' ' + currentLine + ' ';

            formatted += currentLine + '\n';
            breakLineCount++;
            currentLine = "";

            continue; // restart cycle
        }
        if (maxHAdjusted > 0 && (breakLineCount * lineHeight) > maxHAdjusted) {
            // add ... at the end indicating text was cutoff
            formatted = formatted.substr(0, formatted.length - 3) + "...\n";
            currentLine = "";
            break;
        }
        n++;
    }

    if (currentLine != '') {
        while (justify == 'right' && context.measureText(' ' + currentLine).width < maxW)
        currentLine = ' ' + currentLine;

        while (justify == 'center' && context.measureText(' ' + currentLine + ' ').width < maxW)
        currentLine = ' ' + currentLine + ' ';

        formatted += currentLine + '\n';
        breakLineCount++;
        currentLine = "";
    }

    // get rid of empy newline at the end
    formatted = formatted.substr(0, formatted.length - 1);

    var ret = new fabric.Text(formatted, { // return new text-wrapped text obj
        left: t.left,
        top: t.top,
        fill: t.fill,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontStyle: t.fontStyle,
        originX: t.originX,
        originY: t.originY,
        angle: t.angle,
    });
    return ret;
}