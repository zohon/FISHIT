// Move the mouse across the screen as a sine wave.
const robot = require("robotjs");
const Jimp = require('jimp');
const hexRgb = require('hex-rgb');

let inProgress = false;
let numberFish = 0;
let stop = true;

let targetRgb = null;

const ioHook = require('iohook');
ioHook.on('mousedown', event => {
    if(event.x > 0 && event.shiftKey) {
        var hex = robot.getPixelColor(event.x, event.y);
        console.log('SET COLOR', hexRgb(hex));
        if(!targetRgb) {
            targetRgb = hexRgb(hex);
            setTimeout(() => {
                initSearch();
                setTimeout(() => {
                    search();
                }, 2000)
            }, 2000);
        } else {
            targetRgb = hexRgb(hex);
        }
    }
});

ioHook.start();

// Speed up the mouse.
robot.setMouseDelay(0.2);
var twoPI = Math.PI * 2.0;
var screenSize = robot.getScreenSize();
var height = screenSize.height;
var width = screenSize.width;

const size = 400;
const startX = (width / 2) - (size / 2);
const startY = (height / 2) - (size / 2);

let TargetPos = null;
let searching = true;
let catchTime = 0;

let timeBeforeFail = 25000;

function initSearch() {
    catchTime = new Date().getTime();
    robot.moveMouse(startX - (size / 2), startY + (size / 2));
    robot.mouseClick();
    robot.keyTap('a');
}

function search() {
    searchColor().then(info => {
        if (info) {
            console.log('CATCH !!!!', Math.abs(catchTime - new Date().getTime())/1000);
            searching = false;
            clickAndFish(TargetPos)
                .then(() => {
                    TargetPos = null;
                    searching = true;
                    catchTime = new Date().getTime();
                    setTimeout(() => {
                        search();
                    }, 2000)
                }).catch(() => {
                    search();
                });
        } else if(Math.abs(catchTime - new Date().getTime()) > timeBeforeFail) {
            console.log('WHERE');
            initSearch();
            search();
        } else {
            search();
        }
    }).catch(() => {
        if(Math.abs(catchTime - new Date().getTime()) > timeBeforeFail) {
            console.log('WHERE');
            initSearch();
            search();
        } else {
            search();
        }
        
    });

}

function searchColor() {
    return new Promise((resolve, reject) => {
        if (TargetPos) {
            var hex = robot.getPixelColor(startX + TargetPos.x, startY + TargetPos.y);
            if (Math.abs((hexRgb(hex).red + hexRgb(hex).green + hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red + hexRgb(TargetPos.hex).green + hexRgb(TargetPos.hex).blue)) > 80) {
                console.log(Math.abs((hexRgb(hex).red + hexRgb(hex).green + hexRgb(hex).blue) - (hexRgb(TargetPos.hex).red + hexRgb(TargetPos.hex).green + hexRgb(TargetPos.hex).blue)));
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
            for (x = 0; x < size; x += 4) {
                for (y = 0; y < size; y += 4) {
                    // hex is a string, rrggbb format
                    var hex = img.colorAt(x, y);
                    if (verifColor(hex) && !TargetPos) {
                        if (verifColor(img.colorAt(x+10, y+5))) {
                            TargetPos = {
                                x: x+10,
                                y: y+5,
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

    const median = 15;

    const red = (targetRgb? targetRgb.red : 30);
    const green = (targetRgb? targetRgb.green : 0);
    const blue = (targetRgb? targetRgb.blue : 0);

    return hexRgb(hex).red > red - median && hexRgb(hex).red < red + median
        && hexRgb(hex).green > green - median && hexRgb(hex).green < green + median
        && hexRgb(hex).blue > blue - median && hexRgb(hex).blue < blue + median
}


function clickAndFish(TargetPos) {
    return new Promise((resolve, reject) => {
        const mousePos = robot.getMousePos();
        //console.log(mousePos, TargetPos);
        if (mousePos.x < 0) {
            robot.moveMouse(startX, startY - 100);
        }
        setTimeout(() => {
            robot.moveMouseSmooth(startX + TargetPos.x, startY + TargetPos.y);
            robot.mouseClick('right');
            setTimeout(() => {
                robot.keyTap('a');
                resolve();
            }, 1000 + (Math.random() * 100));
        }, 500 + (Math.random() * 100));
    });
}