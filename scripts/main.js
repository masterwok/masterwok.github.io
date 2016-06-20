'use strict';

// Fix orientation scaling bug (http://stackoverflow.com/questions/2557801)
if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
    var viewportmeta = document.querySelector('meta[name="viewport"]');
    if (viewportmeta) {
        viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0';
        document.body.addEventListener('gesturestart', function() {
            viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
        }, false);
    }
}

new WOW().init(); 

new GameOfLife({
    canvasId: 'gameOfLifeTarget'
    , cellSize: 3
    , ratioAlive: 0.12
    , maxCircleRadius: 50
    , circleDropThreshold: 0.5
    , cycleColors: false
    , color: '#d3d3d3'
    , keepAlive: true
}).run();
