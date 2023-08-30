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


const log = new Logs("server");
const USERS = new Map();

router.get("/stream", (req, res, next) => {
  res.sendFile(config.views.stream);
});

router.get("/video", async (req, res, next) => {
  const videos = config.videos;
  
  if(!USERS.get(req.ip)){
     USERS.set(req.ip,[]);
  }
  
  let filteredVideos  = videos.filter(e=>!USERS.get(req.ip).includes(e));
  
  if(filteredVideos.length==0){
    USERS.delete(req.ip);
    filteredVideos = videos;
  } 

  let video = filteredVideos[Math.ceil(Math.random() * filteredVideos.length - 1)];
  if(!USERS.get(req.ip)){
    USERS.set(req.ip,[]);
  } 
  USERS.get(req.ip).push(video);

  res
    .status(200)
    .send({
      path: video,
      title: video.split("/")[2].split(".")[0],
      duration: 15,
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
