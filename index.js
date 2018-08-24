// Move the mouse across the screen as a sine wave.
const robot = require("robotjs");
const Jimp = require('jimp');
const hexRgb = require('hex-rgb');

let inProgress = false;

let numberFish = 0;

// const ioHook = require('iohook');
// ioHook.on('keyup', event => {
//     // console.log(event); // { type: 'mousemove', x: 700, y: 400 }
//     if (event.altKey && event.keycode === 0 && !inProgress) {
//     }
// });

// ioHook.start();

// Speed up the mouse.
robot.setMouseDelay(0.2);
var twoPI = Math.PI * 2.0;
var screenSize = robot.getScreenSize();
var height = screenSize.height;
var width = screenSize.width;

const size = 150;
const startX = (width / 2) - (size / 2);
const startY = (height / 2) - (size / 2);

robot.moveMouse(startX - (size / 2), startY + (size / 2));

let TargetPos = null;
let searching = true;
setInterval(() => {
    if(searching) {
        searchColor().then(info => {
            if(info) {
                console.log('CHANGE !!!!');
                searching = false;
                clickAndFish(TargetPos).then(() =>{
                    searching = true;
                    TargetPos = null;
                }).catch(() => {});
            }
        }).catch(() => {});
    }
}, 10);

function searchColor() {
    return new Promise((resolve, reject) => {

        const img = robot.screen.capture(startX, startY, size, size);

        if (TargetPos) {
            var hex = img.colorAt(TargetPos.x, TargetPos.y);
            if (Math.abs(hexRgb(hex).red - hexRgb(TargetPos.hex).red) > 20 && Math.abs(hexRgb(hex).blue - hexRgb(TargetPos.hex).blue) > 20 && Math.abs(hexRgb(hex).green - hexRgb(TargetPos.hex).green) > 20) {
                console.log(Math.abs( (hexRgb(hex).red+hexRgb(hex).green+hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red+hexRgb(TargetPos.hex).green+hexRgb(TargetPos.hex).blue) ), Math.abs(hexRgb(hex).green - hexRgb(TargetPos.hex).green) , Math.abs(hexRgb(hex).red - hexRgb(TargetPos.hex).red), Math.abs(hexRgb(hex).blue - hexRgb(TargetPos.hex).blue));
            }
            if (Math.abs( (hexRgb(hex).red+hexRgb(hex).green+hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red+hexRgb(TargetPos.hex).green+hexRgb(TargetPos.hex).blue) ) > 220) {
                resolve(TargetPos);
            } else {
                resolve();
            }
        }

        let color = null;
        let y = 0;
        let x = 0;

        // Create a new blank image, same size as Robotjs' one
        // let jimg = new Jimp(size, size);
        for (x = 0; x < size; x++) {
            for (y = 0; y < size; y++) {
                // hex is a string, rrggbb format
                var hex = img.colorAt(x, y);
                if (verifColor(hex) && !TargetPos) {
                    TargetPos = {
                        x: x,
                        y: y,
                        hex : hex
                    };
                    robot.moveMouseSmooth(startX+TargetPos.x+1, startY+TargetPos.y+1);
                    //robot.moveMouseSmooth(startX - (size / 2) - (Math.random() * 10), startY + (size / 2) + (Math.random() * 10));
                    console.log('FIND');
                    resolve();
                }
                // var num = parseInt(hex+"ff", 16)
                // jimg.setPixelColor(num, x, y);
            }
        }
        // jimg.write('test.png');
        reject();
    });
}

function verifColor(hex) {
    return hexRgb(hex).red > 180 && hexRgb(hex).red < 185
}


function clickAndFish(TargetPos) {
    return new Promise((resolve, reject) => {
        const mousePos = robot.getMousePos();
        console.log(mousePos, TargetPos);
        if (mousePos.x < 0) {
            robot.moveMouse(startX, startY - 100);
        }
        robot.moveMouseSmooth(startX+TargetPos.x, startY+TargetPos.y);
        robot.mouseClick('right');
        setTimeout(() => {
            robot.moveMouseSmooth(startX - (size / 2) - (Math.random() * 10), startY + (size / 2) + (Math.random() * 10));
            robot.keyTap('a');
            resolve();
        }, 800 + (Math.random() * 100));
    });
}