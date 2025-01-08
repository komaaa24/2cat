const Logs = require("./logs");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { v4: uuidV4 } = require("uuid");
const dotenv = require("dotenv");
const { getVideoDurationInSeconds } = require("get-video-duration");
const log = new Logs("server");
const crypto = require("crypto");

dotenv.config();

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
  const url = uuidV4();
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
        title: file,
      });
  });
  return videoPathArray;
};

const makeUrlForVideo = (url) => {
  url = url.split(`\\`).slice(6);
  return `${url[0]}\\${url[1]}`;
};

const makeUser = () => {
  const newUserId = crypto.randomUUID();
  let newUser = {};
  newUser["userId"] = newUserId;
  newUser["userStatus"] = "free";
  newUser["lastRoom"] = "";
  return newUser;
};

const bannedUser = (user) => {
  if (user.userStatus == "banned") {
    return true;
  }
  return false;
};

const doesUserExist = (users, userId) => {
  try {
    let ans = false;
    for (let i = 0; i < users.length; i++) {
      if (users[i]["userId"] == userId) {
        return true;
      }
    }
    return ans;
  } catch (err) {
    console.log(`Error while checking user in db`);
    console.log(err);
  }
};

module.exports = {
  bannedUser,
  makeUser,
  errorHandler,
  makeHttps,
  urlMaker,
  getUsersLength,
  getMeetingURL,
  findFreePeer,
  canJoin,
  getAllVideoPaths,
  makeUrlForVideo,
  doesUserExist,
};
