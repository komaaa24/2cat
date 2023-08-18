"use strict";

require("dotenv").config();
const config = require("./config");
const { Server } = require("socket.io");
const compression = require("compression");
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const ffmpeg = require("ffmpeg");
const Logs = require("./logs");
const log = new Logs("server");
const {
  errorHandler,
  makeHttps,
  connectMongoDb,
  getAllVideoPaths,
} = require("./utils");
const checkConnection = require("./canaryTest");
const SocketIOService = require("./socketIOService");
const User = require("./models/user.model");

const isHttps = false; // must be the same on client.js
const port = process.env.PORT || 3000; // must be the same to client.js signalingServerPort

let io;

// Swagger config
const yamlJS = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = yamlJS.load(
  path.join(__dirname + "/../api/swagger.yaml")
);

// Api config

const apiBasePath = "/api/v1"; // api endpoint path
const api_key_secret = process.env.API_KEY_SECRET || "videochat_default_secret";

//const stun = process.env.STUN || "stun:iphone-stun.strato-iphone.de:3478" || "stun:stun.l.google.com:19302";
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

// understood
// Sentry config
const Sentry = require("@sentry/node");
const { CaptureConsole } = require("@sentry/integrations");
const sentryEnabled = process.env.SENTRY_ENABLED || false;
const sentryDSN = process.env.SENTRY_DSN;
const sentryTracesSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE;

// Setup sentry client
// if (sentryEnabled == "true") {
//   Sentry.init({
//     dsn: sentryDSN,
//     integrations: [
//       new CaptureConsole({
//         // array of methods that should be captured
//         // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
//         levels: ["warn", "error"],
//       }),
//     ],
//     // Set tracesSampleRate to 1.0 to capture 100%
//     // of transactions for performance monitoring.
//     // We recommend adjusting this value in production
//     tracesSampleRate: sentryTracesSampleRate,
//   });
// }

// directory
const dir = config.dir;

app.use(cors()); // Enable All CORS Requests for all origins
app.use(compression()); // Compress all HTTP responses using GZip
app.use(express.json()); // Api parse body data as json
app.use(express.static(dir.public)); // Use all static files from the public folder
app.use(express.urlencoded({ extended: true })); // Need for Slack API body parser
app.use(
  apiBasePath + "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
); // api docs

// all start from here
// app.get("*", async (req, res, next) => {
//   try {
//     const isNewUser = await User.findOne({ ip: req.ip });
//     if (!isNewUser) {
//       const newUser = await User.create({
//         ip: req.ip,
//         watched: [],
//       });
//       await newUser.save();
//     }
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

app.use("/", require("./apiRoutes"));

app.get("*", (req, res, next) => {
  res.sendFile(config.views.notFound);
});

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

server.listen(port, async () => {
  await connectMongoDb(config.mongo_uri);
  log.debug("Server is running...\nport " + port);
});

// every 15 seconds, send a ping to each socket to make sure it's still alive
checkConnection(io, 15000);

module.exports = { app };
