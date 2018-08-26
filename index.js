// Move the mouse across the screen as a sine wave.
const robot = require("robotjs");
const Jimp = require('jimp');
const hexRgb = require('hex-rgb');

let inProgress = false;

let numberFish = 0;

// const ioHook = require('iohook');
// ioHook.on('keyup', event => {
//      console.log(event); // { type: 'mousemove', x: 700, y: 400 }
//     if (event && event.keycode === 0 && !inProgress) {
//     } 
// });

// ioHook.start();

// Speed up the mouse.
robot.setMouseDelay(0.2);
var twoPI = Math.PI * 2.0;
var screenSize = robot.getScreenSize();
var height = screenSize.height;
var width = screenSize.width;

const size = 300;
const startX = (width / 2) - (size / 2);
const startY = (height / 2) - (size / 2);

robot.moveMouse(startX - (size / 2), startY + (size / 2));

let TargetPos = null;
let searching = true;


(function searching() {
    searchColor().then(info => {
        if (info) {
            console.log('CHANGE !!!!');
            searching = false;
            clickAndFish(TargetPos)
                .then(() => {
                    TargetPos = null;

                    searching = true;
                    setTimeout(() => {
                        searching();
                    }, 2000)

                }).catch(() => {
                    searching();
                });
        } else {
            searching();
        }
    }).catch(() => {

        searching();
    });

})()

// setInterval(() => {
//     if(searching) {

//     }
// }, 100);

function searchColor() {
    return new Promise((resolve, reject) => {

        if (TargetPos) {
            var hex = robot.getPixelColor(startX + TargetPos.x, startY + TargetPos.y);
            if (Math.abs(hexRgb(hex).red - hexRgb(TargetPos.hex).red) > 20 && Math.abs(hexRgb(hex).blue - hexRgb(TargetPos.hex).blue) > 20 && Math.abs(hexRgb(hex).green - hexRgb(TargetPos.hex).green) > 20) {
                console.log(Math.abs((hexRgb(hex).red + hexRgb(hex).green + hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red + hexRgb(TargetPos.hex).green + hexRgb(TargetPos.hex).blue)), Math.abs(hexRgb(hex).green - hexRgb(TargetPos.hex).green), Math.abs(hexRgb(hex).red - hexRgb(TargetPos.hex).red), Math.abs(hexRgb(hex).blue - hexRgb(TargetPos.hex).blue));
            }
            if (Math.abs((hexRgb(hex).red + hexRgb(hex).green + hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red + hexRgb(TargetPos.hex).green + hexRgb(TargetPos.hex).blue)) > 50) {
                console.log(Math.abs((hexRgb(hex).red + hexRgb(hex).green + hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red + hexRgb(TargetPos.hex).green + hexRgb(TargetPos.hex).blue)));
            }
            if (Math.abs((hexRgb(hex).red + hexRgb(hex).green + hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red + hexRgb(TargetPos.hex).green + hexRgb(TargetPos.hex).blue)) > 100) {
                resolve(TargetPos);
            } else {
                resolve();
            }
        } else {

            let color = null;
            let y = 0;
            let x = 0;

            const img = robot.screen.capture(startX, startY, size, size);
            // Create a new blank image, same size as Robotjs' one
            // let jimg = new Jimp(size, size);
            for (x = 0; x < size; x+= 2) {
                for (y = 0; y < size; y+= 2) {
                    // hex is a string, rrggbb format
                    var hex = img.colorAt(x, y);
                    if (verifColor(hex) && !TargetPos) {
                        if (verifColor(img.colorAt(x + 20, y + 5))) {
                            TargetPos = {
                                x: x + 20,
                                y: y + 5,
                                hex: hex
                            };
                            robot.moveMouseSmooth(startX + TargetPos.x + 1, startY + TargetPos.y + 1);
                            //robot.moveMouseSmooth(startX - (size / 2) - (Math.random() * 10), startY + (size / 2) + (Math.random() * 10));
                            console.log('FIND', hexRgb(hex));
                            resolve();
                        }
                    }
                    // var num = parseInt(hex+"ff", 16)
                    // jimg.setPixelColor(num, x, y);
                }
            }
            // jimg.write('test.png');
            reject();
        }
    });
}

function verifColor(hex) {

    const median = 20;

    const red = 30;
    const green = 0;
    const blue = 0;

    return hexRgb(hex).red > red - median && hexRgb(hex).red < red + median
        && hexRgb(hex).green > green - median && hexRgb(hex).green < green + median
        && hexRgb(hex).blue > blue - median && hexRgb(hex).blue < blue + median
}


function clickAndFish(TargetPos) {
    return new Promise((resolve, reject) => {
        const mousePos = robot.getMousePos();
        console.log(mousePos, TargetPos);
        if (mousePos.x < 0) {
            robot.moveMouse(startX, startY - 100);
        }
        robot.moveMouseSmooth(startX + TargetPos.x, startY + TargetPos.y);
        robot.mouseClick('right');
        setTimeout(() => {
            //robot.moveMouseSmooth(startX - (size / 2) - (Math.random() * 10), startY + (size / 2) + (Math.random() * 10));
            robot.keyTap('a');
            resolve();
        }, 800 + (Math.random() * 100));
    });
}