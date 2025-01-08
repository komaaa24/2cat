const express = require("express");
const Logs = require("./logs");
const router = express.Router();
const config = require("./config");
const { canJoin, findFreePeer, getMeetingURL } = require("./utils");
const { blockMiddleware } = require("./middlewares");
const dotenv = require("dotenv");
const path = require("path");
const { default: axios } = require("axios");

const ENV_PATH = path.resolve(__dirname, "../../.env");
dotenv.config({ path: ENV_PATH });

const smsURL = "http://81.95.228.2:8080/sms_send.php";

const log = new Logs("server");

router.use(blockMiddleware);

router.get("/speaker", (req, res, next) => {
  return res.sendFile(config.views.speaker);
});

router.get("/sendsms", async (req, res, next) => {
  const { msisdn, body } = req.query;
  if (!body || !msisdn) {
    return res.status(403).json({ error: true });
  }
  const url = `${smsURL}?action=sms&msisdn=${msisdn}&body=${body}`;
  const result = await axios.get(url);
  res.status(200).send({ data: result.data });
  return;
});

router.get("/userinfo", async (req, res, next) => {
  const { action, msisdn } = req.query;
  const url = `${smsURL}?action=${action}&msisdn=${msisdn}`;
  const result = await axios.get(url);
  res.status(200).send({ data: result.data });

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

router.get("/join/*", (req, res, next) => {
  res.sendFile(config.views.client);
});

router.get("/admin", (req, res, next) => {
  if (req.query.pass != process.env.ADMIN_PASS) {
    res.status(400).send({ message: "You are not admin" });
    return;
  }
  res.sendFile(config.views.admin);
  return;
});

router.get("/admin/ban-user/:userId", async (req, res, next) => {
  const userId = req.params.userId.trim();
  const users = req.session.users;
  const existsUser = users.filter((user) => user.userId == userId)[0];
  console.log(existsUser);
  if (!existsUser) {
    return res.status(400).send({ message: `${userId} doesn't exist` });
  }
  if (req.query.pass == process.env.ADMIN_PASS) {
    for (let i in users) {
      if (users[i].userId == userId) {
        users[i]["userStatus"] = "banned";
      }
    }
    req.session.users = users;
    res.status(204).send(`User has been banned!`);
    return;
  }
  return res.send("You are not admin");
});

router.get("/admin/free-user/:userId", async (req, res, next) => {
  const users = req.session.users || [];
  const existsUser = users.filter(
    (user) => user.userId == req.params.userId
  )[0];
  console.log(existsUser);
  if (!existsUser) {
    return res
      .status(400)
      .send({ message: `${req.params.userId} doesn't exist` });
  }
  if (req.query.pass == process.env.ADMIN_PASS) {
    for (let i in users) {
      if (users[i].userId == userId) {
        users[i]["userStatus"] = "free";
      }
    }
    req.session.users = users;
    res.status(204).send(`User has been freed`);
    return;
  }
  return res.send("You are not admin");
});

router.get("/admin/all-users", async (req, res, next) => {
  console.log(`Query password : ${req.query.pass}`);
  if (req.query.pass == process.env.ADMIN_PASS) {
    const users = req.session.users || [];
    res.status(200).send({
      users: users,
    });
    return;
  }
  return res.send("You are not admin");
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
