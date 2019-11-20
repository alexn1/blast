'use strict';

var screenSizes = [
    {
        title: 'iPad 1x',
        width: 768,
        height: 1024
    },
    {
        title: 'Tablet',
        width: 834,
        height: 1112
    },
    {
        title: 'Tablet',
        width: 1024,
        height: 1366
    },
    {
        title: 'Tablet',
        width: 480,
        height: 720
    },
    {
        title: 'iPhone 4 1x',
        width: 320,
        height: 480
    },
    {
        title: 'iPhone 4 2x',
        width: 640,
        height: 960
    },
    {
        title: 'Tablet',
        width: 600,
        height: 950
    },
    {
        title: 'Tablet',
        width: 600,
        height: 960
    },
    {
        title: 'Tablet',
        width: 800,
        height: 1280
    },
    {
        title: 'Android',
        width: 480,
        height: 800
    },
    {
        title: 'Tablet',
        width: 600,
        height: 1024
    },
    {
        title: 'iPhone 5 1x',
        width: 320,
        height: 568
    },
    {
        title: 'iPhone 5 2x',
        width: 640,
        height: 1136
    },
    {
        title: 'iPhone 6, 7, 8 1x',
        width: 375,
        height: 667
    },
    {
        title: 'iPhone Plus 6, 7, 8 1x',
        width: 414,
        height: 736
    },
    {
        title: 'iPhone 6, 7, 8 2x',
        width: 750,
        height: 1334
    },
    {
        title: 'Android 16:9 1x',
        width: 360,
        height: 640
    },
    {
        title: 'Tablet',
        width: 450,
        height: 800
    },
    {
        title: 'Android',
        width: 480,
        height: 854
    },
    {
        title: 'Android',
        width: 540,
        height: 960
    },
    {
        title: 'Android 16:9 2x',
        width: 720,
        height: 1280
    },
    {
        title: 'Tablet',
        width: 768,
        height: 1366
    },
    {
        title: 'iPhone Plus 6, 7, 8 3x',
        width: 1242,
        height: 2208
    },
    {
        title: 'Wide 1x',
        width: 360,
        height: 720
    },
    {
        title: 'Android',
        width: 480,
        height: 960
    },
    {
        title: 'Wide 2x',
        width: 720,
        height: 1440
    },
    {
        title: 'Wide 1x',
        width: 360,
        height: 740
    },
    {
        title: 'iPhone X 1x',
        width: 375,
        height: 812
    }
];

var screenSizeList;
var canvas;

var currentScreenSize = window.localStorage.getItem('currentScreenSize');
console.log('currentScreenSize:', currentScreenSize);
if (currentScreenSize === null) {
    currentScreenSize = 23;
    window.localStorage.setItem('currentScreenSize', currentScreenSize);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function (event) {
    console.log('DOM fully loaded and parsed');
    canvas = document.getElementById('gameCanvas');
    setScreenSize(currentScreenSize);

    screenSizeList = document.getElementById('screenSize');
    document.addEventListener('change', onScreenSizeChanged);
    screenSizes.forEach(function (size, index) {
        var option = document.createElement('option');
        option.value = index;
        option.text = size.title + ': ' + size.width + 'x' + size.height + ' - Ratio: ' + (size.height / size.width).toFixed(2);
        screenSizeList.appendChild(option);
    });
    screenSizeList.selectedIndex = currentScreenSize;
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function onScreenSizeChanged(event) {
    console.log('screen size changed:', event);
    //setScreenSize(event.target.selectedIndex);
    window.localStorage.setItem('currentScreenSize', event.target.selectedIndex);
    location.reload();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function setScreenSize(screenSizeIndex) {
    var screenSizeInfo = screenSizes[screenSizeIndex];
    console.log('setScreenSize to:', screenSizeInfo);
    canvas.setAttribute('width', screenSizeInfo.width);
    canvas.setAttribute('height', screenSizeInfo.height);
    document.getElementById('wrp').style.width = screenSizeInfo.width + 'px';
    document.getElementById('controls').style.width = screenSizeInfo.width + 'px';
}