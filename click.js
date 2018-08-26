// Move the mouse across the screen as a sine wave.
const robot = require("robotjs");
const Jimp = require('jimp');
const hexRgb = require('hex-rgb');

setInterval(() => {
    robot.mouseClick('right');
    robot.keyTap('T');
}, 1000*Math.random())
