// API routes

const express = require("express");
const Logs = require("./logs");
const router = express.Router();
const config = require("./config");
const { canJoin, findFreePeer, getMeetingURL } = require("./utils");
const fs = require("fs");
const path = require("path");
const { peers, sockets } = require("./socketIOService");

const log = new Logs("server");
// const api_key_secret = process.env.API_KEY_SECRET || "videochat_default_secret";

router.get("/stream", (req, res, next) => {
  res.sendFile();
});

// FIXME ip will be sent then I have to get it and send appropriate video stream
router.get("/video", (req, res, next) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
    return;
  }
  const videoPath = path.resolve(__dirname, "../../video1.mp4");
  const videoSize = fs.statSync(videoPath).size;

  const CHUNK_SIZE = 10 ** 6; // 1M
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(videoPath, { start, end });

  videoStream.pipe(res);
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
