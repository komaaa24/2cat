const Logs = require("./logs");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { v4: uuidV4 } = require("uuid");
const { default: mongoose } = require("mongoose");
const config = require("./config");
require("dotenv").config();
const { getVideoDurationInSeconds } = require("get-video-duration");
const { faker } = require("@faker-js/faker");
const log = new Logs("server");


const makeHttps = (status, app) => {
  let server,
    host,
    port = process.env.PORT;
  if (status) {
    const options = {
      key: fs.readFileSync(path.join(__dirname, "../ssl/key.pem"), "utf-8"),
      cert: fs.readFileSync(path.join(__dirname, "../ssl/cert.pem"), "utf-8"),
    };
    server = https.createServer(options, app);
    host = "https://" + "localhost" + ":" + port;
  } else {
    server = http.createServer(app);
    host = "http://" + "localhost" + ":" + port;
  }
  return { server, host };
};

const urlMaker = () => {


  adjectivesUz = [
    "kichik",
    "katta",
    "ulkan",
    "yomon",
    "yangi",
    "xursand",
    "yashil",
    "qizil",
    "qora",

    "oq",
    "issiq",
    "salqin",
    "yorqin",
    "shirali",
    "bechora",
    "ajoyib",
    "noyob",
    "omadli",
    "uzun",
    "kalta",
    "yaltiroq",
    "buyuk",
    "uzoq",
    "yolgiz",
    "boy",
    "kelajakdor",
    "toza",
    "jigarrang",
    "qorongi",
    "ahmoq",
    "hikoyalovchi",
    "shovqin",
    "sokin",
    "ahmoqona",
    "dono",
    "chiroyli",
    "silliq",
    "shirin",
    "achchiq",
    "muzdek",
    "issiq",
    "sovuq",
    "qattiq",
    "yumshoq"

  ];

  nounsUz = [
    "it",
    "tipratikan",
    "olma",
    "nok",
    "mushuk",
    "ayiq",
    "kuchuk",
    "echki",
    "ilon",

    "qumursqa",
    "ot",
    "qoshiq",
    "daraxt",
    "stul",
    "stol",
    "divan",
    "sochiq",
    "non",
    "uzum",
    "olmaqand",
    "tosh",
    "sichqon",
    "qush",
    "pishak",
    "mushu",
    "rasm",
    "qurbaqa",
    "tuya",
    "yulbars",
    "zebra",
    "urdak",
    "burgut",
    "baliq",
    "maymun",
    "ukka",
    "quyon",
    "tulki",
    "kit",
    "muscha",
    "pashsha",
    "tuti",
    "chivin",
    "ilon",
    "malla",
    "jajji",
    "yurak",
    "oshqovoq",
    "qalampir",
    "qaldirg'och",
    "begona",
    "shamol"
  ];
  let randomizedAdjective =
    adjectivesUz[Math.floor(Math.random() * adjectivesUz.length)];
  let randomizedNoun = nounsUz[Math.floor(Math.random() * nounsUz.length)];
  let url = randomizedAdjective + "-" + randomizedNoun;
  return url;
};

const errorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError || err.status === 400 || "body" in err) {
    log.error("Request Error", {
      header: req.headers,
      body: req.body,
      error: err.message,
    });
    return res.status(400).send({ status: 404, message: err.message }); // Bad request
  }
  if (req.path.substr(-1) === "/" && req.path.length > 1) {
    let query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
};

const getUsersLength = () => {
  let channelsWith2Peers = Object.keys(peers).filter(
    (key) => Object.keys(peers[key]).length === 1
  );
  let channelsWith1Peers = Object.keys(peers).filter(
    (key) => Object.keys(peers[key]).length === 2
  );
  return channelsWith2Peers.length * 2 + channelsWith1Peers.length;
};

/**
 * Request meeting room endpoint
 * @returns  entrypoint / Room URL for your meeting.
 */
const getMeetingURL = (host) => {
  return (
    "http" +
    (host.includes("localhost") ? "" : "s") +
    "://" +
    host +
    "/join/" +
    uuidV4()
  );
};

const findFreePeer = (peers) => {
  let freePeer = "";
  let available = Object.keys(peers).filter(
    (key) => Object.keys(peers[key]).length === 1
  );
  if (available.length > 0) {
    freePeer = available[0];
  } else {
    // generate random 6 digit number
    let random = urlMaker();
    freePeer = random;
  }
  return freePeer;
};

const canJoin = (reqQuery) => {
  if (Object.keys(reqQuery).length <= 0) {
    return false;
  } else if (
    !reqQuery.room ||
    !reqQuery.name ||
    !reqQuery.audio ||
    !reqQuery.video ||
    !reqQuery.screen ||
    !reqQuery.notify
  ) {
    return false;
  }
  return true;
};

const connectMongoDb = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB...`);
  } catch (err) {
    console.error(`There is an error while connecting to database \n ${err}`);
  }
};

/**
 *
 * @param {string} videosPath
 * @returns {string[]}
 */

const getAllVideoPaths = (videosPath) => {
  const videoPathArray = [];
  let videoDuration;
  // From a local path...

  fs.readdirSync(`${videosPath}`).forEach(async (file, index) => {
    file = `${videosPath}/${file}`;
    videoDuration = await getVideoDurationInSeconds(file);
    var stat = fs.statSync(file),
      info = new Date(fs.lstatSync(file).birthtimeMs);
    if (!stat.isDirectory())
      videoPathArray.push({
        path: file,
        duration: videoDuration,
        title: faker.internet.userName(),
      });
  });
  return videoPathArray;
};

const makeUrlForVideo = (url) => {
  url = url.split(`\\`).slice(6);
  return `${url[0]}\\${url[1]}`;
};

module.exports = {
  errorHandler,
  makeHttps,
  urlMaker,
  getUsersLength,
  getMeetingURL,
  findFreePeer,
  canJoin,
  connectMongoDb,
  getAllVideoPaths,
  makeUrlForVideo,
};
