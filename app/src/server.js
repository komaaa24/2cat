"use strict";

const dotenv = require("dotenv");
const config = require("./config");
const { Server } = require("socket.io");
const compression = require("compression");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const sessions = require("express-session");

const ENV_PATH = path.resolve(__dirname, "../../.env");
dotenv.config({ path: ENV_PATH });

const axios = require("axios");

const app = express();
const Logs = require("./logs");
const log = new Logs("server");
const { errorHandler, makeHttps } = require("./utils");
const checkConnection = require("./canaryTest");
const SocketIOService = require("./socketIOService");
const { blockMiddleware } = require("./middlewares");


const isHttps = false; // must be the same on client.js
const port = process.env.PORT || 3000; // must be the same to client.js signalingServerPort

let io;
//const stun = "stun:bn-turn1.xirsys.com";
const stun = config.stunServers[0];

// Turn config
const turnEnabled = config.turn.status;
const turnUrls = config.turn.credential[0].url;
const turnUsername = config.turn.credential[0].username;
const turnCredential = config.turn.credential[0].credentialName;
//const turnUrls = "turn:213.230.110.176:3478";
//const turnUsername = "videochatuz";
//const turnCredential = "$2y$10$3fAA1mA33ywO0TyDQrQdWO3KtPtbE6MAwKl4rJnnfR.g.vITiU2/q";
const turnUrls2 = config.turn.credential[1].url;
const turnCredential2 = config.turn.credential[1].credentialName;
const turnUsername2 = config.turn.credential[1].username;

// directory
const dir = config.dir;

const twoDays = 1000 * 60 * 60 * 48;

app.use(cors()); // Enable All CORS Requests for all origins
app.use(compression()); // Compress all HTTP responses using GZip
app.use(express.json()); // Api parse body data as json
app.use(express.static(dir.public)); // Use all static files from the public folder
app.use(express.urlencoded({ extended: true })); // Need for Slack API body parser
app.use(cookieParser());
app.use(sessions({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  cookie: { maxAge: twoDays },
  resave: false
}))




app.use(blockMiddleware);

app.use("/", require("./apiRoutes"));

/*
app.get("/headers", (req, res) => {
    res.json(req.headers);
});
*/

/**
 * You should probably use a different stun-turn server
 * doing commercial stuff, also see:
 *
 * https://github.com/coturn/coturn
 * https://gist.github.com/zziuni/3741933
 * https://www.twilio.com/docs/stun-turn
 *
 * Check the functionality of STUN/TURN servers:
 * https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
 */

// Stun is always needed
config.iceServers.push({ urls: stun });

if (turnEnabled == "true") {
  config.iceServers.push({
    urls: turnUrls,
    username: turnUsername,
    credential: turnCredential,
  });
} else {
  // As backup if not configured, please configure your own in the .env file
  // https://www.metered.ca/tools/openrelay/
  // iceServers.push({
  //   urls: "turn:openrelay.metered.ca:443",
  //   username: "openrelayproject",
  //   credential: "openrelayproject",
  // });
  config.iceServers.push({
    urls: turnUrls,
    username: turnUsername,
    credential: turnCredential,
  });
}

// Test Stun and Turn connection with query params
// const testStunTurn = host + "/test?iceServers=" + JSON.stringify(iceServers);

app.use(errorHandler);

// creating server
const { server, host } = makeHttps(isHttps, app);
/*  
Set maxHttpBufferSize from 1e6 (1MB) to 1e7 (10MB)
*/
// understood
io = new Server({
  maxHttpBufferSize: 1e7,
  transports: ["websocket"],
}).listen(server);

const socketService = new SocketIOService(io);

server.listen(port, () => {
  // await connectMongoDb(config.mongo_uri);
  log.debug("Server is running...\nport " + port);
});

// every 15 seconds, send a ping to each socket to make sure it's still alive
checkConnection(io, 25000);

module.exports = { app };
