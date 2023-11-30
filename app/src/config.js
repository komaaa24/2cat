const path = require("path");
require("dotenv").config();

module.exports = {
  bannedUsers: [],
  users: [],
  channels: {}, // collect channels
  sockets: {}, // collect sockets
  peers: {},
  videos: [
    "/videos/alisa.mp4",
    "/videos/aziza.mp4",
    "/videos/john.mp4",
    "/videos/maria.mp4",
    "/videos/mark.mp4",
    "/videos/nozima.mp4",
    "/videos/shohida.mp4",
    "/videos/gulchehra.mp4",
    "/videos/phobe.mp4",
    "/videos/rose.mp4",
  ],
  views: {
    client: path.join(__dirname, "../../", "public/views/client.html"),
    landing: path.join(__dirname, "../../", "public/views/landing.html"),
    newCall: path.join(__dirname, "../../", "public/views/newcall.html"),
    notFound: path.join(__dirname, "../../", "public/views/404.html"),
    permission: path.join(__dirname, "../../", "public/views/permission.html"),
    privacy: path.join(__dirname, "../../", "public/views/privacy.html"),
    stunTurn: path.join(__dirname, "../../", "public/views/testStunTurn.html"),
    teststream: path.join(__dirname, "../../", "public/views/teststream.html"),
    stream: path.join(__dirname, "../../", "public/views/stream.html"),
    admin: path.join(__dirname, "../../", "public/views/admin.html"),
    speaker: path.join(__dirname, "../../", "public/views/speakerTest.html")
  },
  dir: {
    public: path.join(__dirname, "../../", "public"),
  },
  stunServers: [
    "stun:213.230.110.176:3478",
    "stun:stun.l.google.com:19302",
    "stun:iphone-stun.strato-iphone.de:3478",
    "stun:stun.sipnet.net:3478",
    "stun:bn-turn1.xirsys.com",
    "stun:a.relay.metered.ca:80",
  ],
  turn: {
    status: true,
    credential: [
      {
        url: "turn:a.relay.metered.ca:80" || process.env.TURN_URLS,
        credentialName: "G6sedqXT65/CucHv" || process.env.TURN_PASSWORD,
        username: "e9e0948e08a59457a6f7d973",
      },
      {
        url: "turn:numb.viagenie.ca",
        credentialName: "muazkh",
        username: "webrtc@live.com",
      },
    ],
  },
  mongo_uri: process.env.MONGO_URI,
  iceServers: [],
};
