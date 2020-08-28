const fs = require("fs");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const robot = require("robotjs");
const hexRgb = require("hex-rgb");
let Jimp = require("jimp");

const PNGjs = require("png-js");

const inquirer = require("inquirer");

const size = 400;
const screenSize = robot.getScreenSize();
const height = screenSize.height;
const width = screenSize.width;

const threshold = 0.1;
const MOY_LIMIT_MULTI = 4;
const MINCOUNT = 10;

const startX = width / 2 - size / 2;
const startY = height / 2 - size / 2;

const rimg = robot.screen.capture(startX, startY, size, size);
const space = 1;
// Create a new blank image, same size as Robotjs' one
jimg = new Jimp(size, size);

const wait = (time = 200) => {
  return new Promise((resolve) => setTimeout(() => resolve(), time));
};

const getImage = async (rimg, target) => {
  var jimg = new Jimp(size, size);
  for (var x = 0; x < size; x++) {
    for (var y = 0; y < size; y++) {
      var index = y * rimg.byteWidth + x * rimg.bytesPerPixel;
      var r = rimg.image[index];
      var g = rimg.image[index + 1];
      var b = rimg.image[index + 2];
      var num = r * 256 + g * 256 * 256 + b * 256 * 256 * 256 + 255;
      jimg.setPixelColor(num, x, y);
    }
  }
  await jimg.write(target);
  return jimg;
};
let moy = [];
let oldCombo = [];
let pixelCombo = [];

let isOn = false;

const getDiff = async () => {
  if (!isOn) {
    return;
  }

  const time = 100;
  const rimg1 = robot.screen.capture(startX, startY, size, size);
  getImage(rimg1, "file.png");
  await wait(time);
  const rimg2 = robot.screen.capture(startX, startY, size, size);
  getImage(rimg2, "file2.png");
  await wait(time);
  const img1 = PNG.sync.read(fs.readFileSync("file.png"));
  const img2 = PNG.sync.read(fs.readFileSync("file2.png"));

  const { width, height } = img1;
  const diff = new PNG({ width, height });
  pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: threshold,
  });
  fs.writeFileSync("diff.png", PNG.sync.write(diff));
  await wait(100);

  let countRed = 0;

  if (pixelCombo) oldCombo = pixelCombo;
  pixelCombo = [];

  const tresholdColor = 200;

  if (!isOn) {
    return;
  }

  PNGjs.decode("diff.png", async (pixels) => {
    // pixels is a 1d array (in rgba order) of decoded pixel data

    if (!isOn) {
      return;
    }

    let combo = 0;
    let maxCombo = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 1] < tresholdColor) {
        countRed++;
        const y = Math.floor(index / (width * 4));
        const x = (index - y * (width * 4)) / 4;

        if (combo > maxCombo) {
          maxCombo = combo;
          if (pixelCombo.length && y != pixelCombo[0].y) {
            pixelCombo = [];
          }
          pixelCombo.push({ x: x, y: y });
        }
        combo++;
      } else {
        combo = 0;
      }
    }

    if (countRed > MINCOUNT) {
      moy.push(countRed);
    }

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${median(moy)} ${countRed}`);

    if (
      moy.length &&
      countRed > median(moy) * MOY_LIMIT_MULTI &&
      oldCombo.length
    ) {
      const avgComboX = oldCombo[oldCombo.length - 1].x - oldCombo[0].x;
      const mousePos = robot.getMousePos();
      if (mousePos.x < 0) {
        robot.moveMouse(startX, startY - 100);
      }
      robot.moveMouseSmooth(
        startX + oldCombo[0].x + avgComboX,
        startY + oldCombo[oldCombo.length - 1].y
      );
      robot.mouseClick("right");
      await wait(1000);
      robot.keyTap("a");
      await wait(3000);
      moy = [];
      getDiff();
    } else {
      getDiff();
    }
  });
};

const median = (arr) => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

askQuestion = () => {
  console.clear();
  inquirer
    .prompt([
      {
        type: "list",
        name: "status",
        message: "FISHING",
        choices: [!isOn ? "Start" : "Stop"],
        filter: function (val) {
          return val.toLowerCase();
        },
      },
    ])
    .then((answers) => {
      isOn = answers.status === "start";
      if (isOn) {
        getDiff();
      }
      askQuestion();
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
      } else {
        // Something else when wrong
      }
    });
  process.stdout.write(`\n`);
};

askQuestion();

// const img1 = PNG.sync.read(fs.readFileSync("file.png"));
// const img2 = PNG.sync.read(fs.readFileSync("file2.png"));
// const { width, height } = img1;
// const diff = new PNG({ width, height });

// pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });

// fs.writeFileSync("diff.png", PNG.sync.write(diff));
