const _ = require("lodash");
const fs = require("fs");
const robot = require("robotjs");
const hexRgb = require("hex-rgb");
const ioHook = require("iohook");

let targetRgb = null;
let active = false;

ioHook.on("mousedown", (event) => {
  if (event.x > 0 && event.ctrlKey && event.altKey) {
    // click+crtl+alt
    var hex = robot.getPixelColor(event.x, event.y);
    active = true;
    if (!targetRgb) {
      targetRgb = hexRgb(hex);
      setTimeout(() => {
        initSearch();
        setTimeout(() => {
          search();
        }, 2000);
      }, 2000);
    } else {
      targetRgb = hexRgb(hex);
    }
    process.stdout.write("\u001b[2J\u001b[0;0H");
    process.stdout.write(`INITIALIZING FISHING`);
  } else if (event.x > 0 && event.ctrlKey) {
    // click+crtl+alt
    setTimeout(() => {
      var hex = robot.getPixelColor(event.x, event.y);
      active = true;
      if (!targetRgb) {
        targetRgb = hexRgb(hex);
        setTimeout(() => {
          initSearch();
          setTimeout(() => {
            search();
          }, 2000);
        }, 2000);
      } else {
        targetRgb = hexRgb(hex);
      }
      console.log("SET COLOR DELAY", hexRgb(hex));
    }, 1000);
  }
});

ioHook.on("keydown", (event) => {
  if (event.keycode === 53 && event.ctrlKey && event.altKey) {
    // ctrl+alt+:
    active = !active;
    if (active) {
      search();
    } else {
      process.stdout.write("\u001b[2J\u001b[0;0H");
      process.stdout.write(
        `FISHING is paused : Press [ ctrl + alt + : ] to activate`
      );
    }
  }
});

process.stdout.write("\u001b[2J\u001b[0;0H");
process.stdout.write("Pause [ ctrl + alt + : ]\n");
process.stdout.write("Listening to Bobber color [ click + crtl + alt ]");
ioHook.start();

// Speed up the mouse.
robot.setMouseDelay(0.2);
var screenSize = robot.getScreenSize();
var height = screenSize.height;
var width = screenSize.width;

const size = 400;
const startX = width / 2 - size / 2;
const startY = height / 2 - size / 2;

let TargetPos = null;
let catchTime = 0;
let lastCatch = null;

const fishingTime = 20;

const timeBeforeFail = fishingTime * 1000; // milisecond

function initSearch() {
  catchTime = new Date().getTime();
  robot.moveMouse(startX - size / 2, startY + size / 2);
  robot.mouseClick();
  robot.keyTap("a");
}

let catchFish = 0;
let timingFish = [];

const wait = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const search = () => {
  if (!active) {
    return;
  }

  searchColor()
    .then(async (info) => {
      if (info) {
        timingFish.push(Math.abs(catchTime - new Date().getTime()) / 1000);
        catchFish++;

        fs.writeFileSync(
          "fishData.json",
          JSON.stringify({
            fish: catchFish,
            timing: Math.round(_.mean(timingFish) * 100) / 100,
          })
        );

        // process.stdout.write("\u001b[2J\u001b[0;0H");
        // process.stdout.write(
        //   "FISH : " +
        //     catchFish +
        //     " timing : " +
        //     Math.round(_.mean(timingFish) * 100) / 100
        // );

        searching = false;
        clickAndFish(TargetPos)
          .then(() => {
            TargetPos = null;
            searching = true;
            setTimeout(() => {
              search();
            }, 1000);
          })
          .catch(() => {
            search();
          });
      } else if (Math.abs(catchTime - new Date().getTime()) > timeBeforeFail) {
        lost();
      } else {
        await wait(1);
        search();
      }
    })
    .catch(() => {
      if (Math.abs(catchTime - new Date().getTime()) > timeBeforeFail) {
        lost();
      } else {
        search();
      }
    });
};

function lost() {
  console.log("Lost");
  robot.moveMouse(startX - size / 2, startY + size / 2);
  robot.mouseClick();
  robot.keyTap("e");
  setTimeout(() => {
    initSearch();
    search();
  }, 3000);
}

function searchColor() {
  return new Promise((resolve, reject) => {
    if (TargetPos) {
      var hex = robot.getPixelColor(startX + TargetPos.x, startY + TargetPos.y);

      displayInfo(`FISHING`);

      if (
        Math.abs(
          hexRgb(hex).red +
            hexRgb(hex).green +
            hexRgb(hex).blue -
            (hexRgb(TargetPos.hex).red +
              hexRgb(TargetPos.hex).green +
              hexRgb(TargetPos.hex).blue)
        ) > 80
      ) {
        resolve(TargetPos);
      } else {
        resolve();
      }
    } else {
      let y = 0;
      let x = 0;

      const img = robot.screen.capture(startX, startY, size, size);
      const space = 5;
      // Create a new blank image, same size as Robotjs' one

      for (x = 0; x < size; x += space) {
        for (y = 0; y < size; y += space) {
          // hex is a string, rrggbb format

          const hex = img.colorAt(x, y);

          if (verifColor(hex) && !TargetPos) {
            if (verifColor(img.colorAt(x + space * 2, y + space))) {
              TargetPos = {
                x: x + space * 2,
                y: y + space,
                hex: hex,
              };
              // robot.moveMouseSmooth(
              //   startX + TargetPos.x + 1,
              //   startY + TargetPos.y + 1
              // );
              //robot.moveMouseSmooth(startX - (size / 2) - (Math.random() * 10), startY + (size / 2) + (Math.random() * 10));
              // process.stdout.write("\u001b[2J\u001b[0;0H");
              // process.stdout.write(`FISH !!!`);
              resolve();
            }
          }
          // var num = parseInt(hex+"ff", 16)
          // jimg.setPixelColor(num, x, y);
        }
      }
      // jimg.write('test.png');

      displayInfo(`Searching BOBBER`);

      reject();
    }
  });
}

function displayTime() {
  return Math.abs(catchTime - new Date().getTime());
}

function verifColor(hex) {
  const median = 15;

  const red = targetRgb ? targetRgb.red : 0;
  const green = targetRgb ? targetRgb.green : 0;
  const blue = targetRgb ? targetRgb.blue : 0;

  return (
    hexRgb(hex).red > red - median &&
    hexRgb(hex).red < red + median &&
    hexRgb(hex).green > green - median &&
    hexRgb(hex).green < green + median &&
    hexRgb(hex).blue > blue - median &&
    hexRgb(hex).blue < blue + median
  );
}

function clickAndFish(TargetPos) {
  return new Promise((resolve, reject) => {
    const mousePos = robot.getMousePos();
    if (mousePos.x < 0) {
      robot.moveMouse(startX, startY - 100);
    }
    setTimeout(() => {
      robot.moveMouseSmooth(startX + TargetPos.x, startY + TargetPos.y);
      robot.mouseClick("right");

      displayInfo(`CATCH !!! ${Math.round(displayTime() / 1000)}s`);
      lastCatch = displayTime();

      setTimeout(() => {
        // robot.moveMouseSmooth(
        //   startX - size / 2,
        //   startY + size / 2 + Math.random() * 10
        // );
        robot.keyTap("a");
        catchTime = new Date().getTime();
        resolve();
      }, 1500 + Math.random() * 100);
    }, 500 + Math.random() * 100);
  });
}

lastMessage = null;
displayInfo = (text = "") => {
  if (lastMessage !== `${twirlTimer()} ${text}`) {
    process.stdout.write("\u001b[2J\u001b[0;0H");
    process.stdout.write(`${twirlTimer()} ${text}`);
    lastMessage = `${twirlTimer()} ${text}`;
  }
};

twirlTimer = (
  percent = (timeBeforeFail - Math.abs(catchTime - new Date().getTime())) /
    timeBeforeFail
) => {
  const loading = [];
  for (let index = 0; index < fishingTime; index++) {
    let result = "-";

    if (index < percent * fishingTime) {
      result = "=";
    }

    if (lastCatch) {
      if (
        ((timeBeforeFail - lastCatch) / timeBeforeFail) * fishingTime >
        index
      ) {
        result = color(result);
      }
    }

    loading.push(result);
  }
  return `[${loading.join("")}]`;
};

color = (text = "") => {
  return `\x1b[36m${text}\x1b[0m`;
};
