// API routes

const express = require("express");
const Logs = require("./logs");
const router = express.Router();
const config = require("./config");
const { canJoin, findFreePeer } = require("./utils");
const fs = require("fs");
const path = require("path");

const log = new Logs("server");
// const api_key_secret = process.env.API_KEY_SECRET || "videochat_default_secret";

router.get("/video", (req, res, next) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
    return;
  }
  const videoPath = "../../public/videos/video1.mp4";
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
  let freePeer = findFreePeer(peers);
  res.send(JSON.stringify({ freePeer: freePeer }));
});

router.get("/api/groupspeer", (req, res) => {
  let users = Object.keys(sockets).length;
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

module.exports = router;
