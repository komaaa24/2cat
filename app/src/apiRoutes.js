// API routes

const express = require("express");
const Logs = require("./logs");
const router = express.Router();
const config = require("./config");
const {
  canJoin,
  findFreePeer,
  getMeetingURL,
  makeUrlForVideo,
} = require("./utils");
const fs = require("fs");
const path = require("path");
// const User = require("./models/user.model");
// const { getVideoDurationInSeconds } = require("get-video-duration");

const log = new Logs("server");
// const api_key_secret = process.env.API_KEY_SECRET || "videochat_default_secret";

router.get("/stream", (req, res, next) => {
  res.sendFile(config.views.stream);
});

router.get("/video", async (req, res, next) => {
  // console.log(req.ip);

  // let user = await User.findOne({ ip: req.ip });

  // if (!user) {
  //   user = await User.create({ ip: req.ip });
  // }

  let videos = config.videos;
  // videos = videos.filter((v) => !user.watched.includes(v.path));
  // let video =
  //   videos.length > 0
  //     ? videos[Math.ceil(Math.random() * videos.length - 1)]
  //     : config.videos[Math.ceil(Math.random() * config.videos.length - 1)];

  // if (user.watched.length >= config.videos.length) {
  //   user.watched = [];
  // }

  // user.watched.push({
  //   path: video.path,
  //   duration: video.duration,
  //   title: video.title,
  // });
  // console.log(user.watched);
  // await user.save();

  // const range = req.headers.range;
  // if (!range) {
  //   res.status(400).send("Requires Range header");
  //   return;
  // }

  let video = videos[Math.ceil(Math.random() * videos.length - 1)];
  let videoPath = path.resolve(video.path);


  videoPath = makeUrlForVideo(videoPath);

  // const CHUNK_SIZE = 10 ** 6; // 1M
  // const start = Number(range.replace(/\D/g, ""));
  // if (start >= videoSize) {
  //   // Send error
  //   res.status(416).send("Range not satisfiable");
  //   return;
  // }
  // const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // // headers
  // const contentLength = end - start + 1;
  // const headers = {
  //   "Content-Range": `bytes ${start}-${end}/${videoSize}`,
  //   "Accept-Ranges": "bytes",
  //   "Content-Length": contentLength,
  //   "Content-Type": "video/mp4",
  // };

  // res.writeHead(206, headers);

  // const videoStream = fs.createReadStream(videoPath, { start, end });

  // videoStream.pipe(res);

  res
    .status(200)
    .send({
      path: video.path.split("public")[1],
      title: videoPath.split("\\")[1].split(".")[0],
      duration: video.duration,
    });
  return;
});

router.get("/", (req, res, next) => {
  res.sendFile(config.views.landing);
});

router.get("/newcall", (req, res, next) => {
  res.sendFile(config.views.newCall);
});

router.get("/permission", (req, res, next) => {
  res.sendFile(config.views.permission);
});

router.get("/privacy", (req, res, next) => {
  res.sendFile(config.views.privacy);
});

router.get("/api/freepeers", (req, res, next) => {
  let freePeer = findFreePeer(config.peers);
  res.send(JSON.stringify({ freePeer: freePeer }));
});

router.get("/api/groupspeer", (req, res) => {
  let users = Object.keys(config.sockets).length;
  res.send(JSON.stringify({ users: users }));
});

router.get("/join", (req, res, next) => {
  const canUserJoin = canJoin(req.query);
  if (canUserJoin) {
    log.debug("Request Query", req.query);
    return res.sendFile(config.views.client);
  }
  res.redirect("/");
});

// Join Room *
router.get("/join/*", (req, res, next) => {
  res.sendFile(config.views.client);
});

router.post("/api/v1", (req, res, next) => {
  // check if user was authorized for the api call
  let authorization = req.headers.authorization;
  if (authorization != api_key_secret) {
    log.debug("Videochat get meeting - Unauthorized", {
      header: req.headers,
      body: req.body,
    });
    return res.status(403).json({ error: "Unauthorized!" });
  }
  // setup meeting URL
  let host = req.headers.host;
  let meetingURL = getMeetingURL(host);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ meeting: meetingURL }));

  // log.debug the output if all done
  log.debug("Videochat get meeting - Authorized", {
    header: req.headers,
    body: req.body,
    meeting: meetingURL,
  });
});

module.exports = router;
