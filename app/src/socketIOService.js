const Logs = require("./logs");
const { urlMaker } = require("./utils");
const configs = require("./config");

const log = new Logs("socket service");

module.exports = class SocketIOService {
  constructor(io) {
    this.io = io;
    this.onConnect();
  }

  onConnect() {
    this.io.sockets.on("connect", async (socket) => {
      log.debug("[" + socket.id + "] connection accepted", {
        host: socket.handshake.headers.host.split(":")[0],
      });

      socket.on("log", data => {
        console.log("--------------------------------")
        console.log(data);
        console.log("--------------------------------")
      })

      socket.channels = {};
      configs.sockets[socket.id] = socket;
      /**
       * Check upgrade transport
       */
      socket.conn.on("upgrade", () => {
        const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
        log.debug(
          "[" + socket.id + "] Connection upgraded transport",
          upgradedTransport
        );
      });

      /**
       * On peer disconnected
       */
      socket.on("disconnect", async (reason) => {
        for (let channel in socket.channels) {
          await this.removePeerFrom(channel, socket);
        }
        log.debug("[" + socket.id + "] disconnected", { reason: reason });
        delete configs.sockets[socket.id];
      });

      /**
       * On peer join
       */

      // understood
      socket.on("join", async (config) => {
        log.debug('Join room', config);
        // log.debug("[" + socket.id + "] join ", config);

        let channel = config.channel;
        let channel_password = config.channel_password;
        let peer_name = config.peer_name;
        let peer_video = config.peer_video;
        let peer_audio = config.peer_audio;
        let peer_video_status = config.peer_video_status;
        let peer_audio_status = config.peer_audio_status;
        let peer_screen_status = config.peer_screen_status;
        let peer_hand_status = config.peer_hand_status;
        let peer_rec_status = config.peer_rec_status;
        let peer_privacy_status = config.peer_privacy_status;
        let peer_geo = config.peer_geo;
        if (channel in socket.channels) {
          return log.debug(
            "[" + socket.id + "] [Warning] already joined",
            channel
          );
        }
        // no channel aka room in channels init
        if (!(channel in configs.channels)) configs.channels[channel] = {};

        // no channel aka room in peers init
        if (!(channel in configs.peers)) configs.peers[channel] = {};

        // room locked by the participants can't join
        if (
          configs.peers[channel]["lock"] === true &&
          configs.peers[channel]["password"] != channel_password
        ) {
          log.debug("[" + socket.id + "] [Warning] Room Is Locked", channel);
          return socket.emit("roomIsLocked");
        }

        // collect peers info grp by channels
        configs.peers[channel][socket.id] = {
          peer_name: peer_name,
          peer_video: peer_video,
          peer_audio: peer_audio,
          peer_video_status: peer_video_status,
          peer_audio_status: peer_audio_status,
          peer_screen_status: peer_screen_status,
          peer_hand_status: peer_hand_status,
          peer_rec_status: peer_rec_status,
          peer_privacy_status: peer_privacy_status,
        };
        //log.debug("[Join] - connected peers grp by roomId", configs.peers);
        await this.addPeerTo(channel, socket);

        configs.channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;

        // Send some server info to joined peer TODO is it working?
        await this.sendToPeer(socket.id, configs.sockets, "serverInfo", {
          peers_count: Object.keys(configs.peers[channel]).length,
        });
      });

      /**
       * Relay ICE to peers
       */
      socket.on("relayICE", async (config) => {
        let peer_id = config.peer_id;
        let ice_candidate = config.ice_candidate;

        await this.sendToPeer(peer_id, configs.sockets, "iceCandidate", {
          peer_id: socket.id,
          ice_candidate: ice_candidate,
        });
      });

      /**
       * Relay SDP to peers
       */
      socket.on("relaySDP", async (config) => {
        let peer_id = config.peer_id;
        let session_description = config.session_description;

        log.debug(
          "[" + socket.id + "] relay SessionDescription to [" + peer_id + "] ",
          {
            type: session_description.type,
          }
        );

        await this.sendToPeer(peer_id, configs.sockets, "sessionDescription", {
          peer_id: socket.id,
          session_description: session_description,
        });
      });

      /**
       * Handle Room action
       */

      // understood
      socket.on("roomAction", async (config) => {
        console.log(config);
        let room_is_locked = false;
        let room_id = config.room_id;
        let peer_name = config.peer_name;
        let password = config.password;
        let action = config.action;

        try {
          switch (action) {
            case "lock":
              configs.peers[room_id]["lock"] = true;
              configs.peers[room_id]["password"] = password;
              await this.sendToRoom(room_id, socket.id, "roomAction", {
                peer_name: peer_name,
                action: action,
              });
              room_is_locked = true;
              break;
            case "unlock":
              delete configs.peers[room_id]["lock"];
              delete configs.peers[room_id]["password"];
              await this.sendToRoom(room_id, socket.id, "roomAction", {
                peer_name: peer_name,
                action: action,
              });
              break;
            case "checkPassword":
              let config = {
                peer_name: peer_name,
                action: action,
                password:
                  password == configs.peers[room_id]["password"] ? "OK" : "KO",
              };
              await this.sendToPeer(
                socket.id,
                configs.sockets,
                "roomAction",
                config
              );
              break;
          }
        } catch (err) {
          log.error("Room action", this.toJson(err));
        }
        log.debug("[" + socket.id + "] Room " + room_id, {
          locked: room_is_locked,
          password: password,
        });
      });

      /**
       * Relay NAME to peers
       */

      // understood
      socket.on("peerName", async (config) => {
        // log.debug('Peer name', config);
        let room_id = config.room_id;
        let peer_name_old = config.peer_name_old;
        let peer_name_new = config.peer_name_new;
        let peer_id_to_update = null;

        for (let peer_id in configs.peers[room_id]) {
          if (configs.peers[room_id][peer_id]["peer_name"] == peer_name_old) {
            configs.peers[room_id][peer_id]["peer_name"] = peer_name_new;
            peer_id_to_update = peer_id;
          }
        }

        if (peer_id_to_update) {
          log.debug(
            "[" + socket.id + "] emit peerName to [room_id: " + room_id + "]",
            {
              peer_id: peer_id_to_update,
              peer_name: peer_name_new,
            }
          );

          await this.sendToRoom(room_id, socket.id, "peerName", {
            peer_id: peer_id_to_update,
            peer_name: peer_name_new,
          });
        }
      });

      /**
       * Relay Audio Video Hand ... Status to peers
       */

      socket.on("peerStatus", async (config) => {
        // log.debug('Peer status', config);
        let room_id = config.room_id;
        let peer_name = config.peer_name;
        let element = config.element;
        let status = config.status;
        try {
          for (let peer_id in configs.peers[room_id]) {
            if (configs.peers[room_id][peer_id]["peer_name"] == peer_name) {
              switch (element) {
                case "video":
                  configs.peers[room_id][peer_id]["peer_video_status"] = status;
                  break;
                case "audio":
                  configs.peers[room_id][peer_id]["peer_audio_status"] = status;
                  break;
                case "screen":
                  configs.peers[room_id][peer_id]["peer_screen_status"] =
                    status;
                  break;
                case "hand":
                  configs.peers[room_id][peer_id]["peer_hand_status"] = status;
                  break;
                case "rec":
                  configs.peers[room_id][peer_id]["peer_rec_status"] = status;
                  break;
                case "privacy":
                  configs.peers[room_id][peer_id]["peer_privacy_status"] =
                    status;
                  break;
              }
            }
          }

          log.debug(
            "[" + socket.id + "] emit peerStatus to [room_id: " + room_id + "]",
            {
              peer_id: socket.id,
              element: element,
              status: status,
            }
          );

          await this.sendToRoom(room_id, socket.id, "peerStatus", {
            peer_id: socket.id,
            peer_name: peer_name,
            element: element,
            status: status,
          });
        } catch (err) {
          log.error("Peer Status", this.toJson(err));
        }
      });

      socket.on("nextPeer", async (config) => {
        const isNull =
          configs.peers != null && configs.peers != undefined ? true : false;
        const peersLength =
          isNull && Object.keys(configs.peers).length > 0
            ? Object.keys(configs.peers[Object.keys(configs.peers)[0]]).length
            : 0;
        let freePeer = this.findFreePeer(
          config.room_id,
          config.last5peers,
          config.typeOfCall
        );
        if (freePeer) {
          await this.sendToPeer(config.peer_id, configs.sockets, "nextPeer", {
            freePeer: freePeer,
            error: null,
            peersCount: peersLength,
          });
        } else {
          if (config.typeOfCall == "leftUser") {
            await this.sendToPeer(config.peer_id, configs.sockets, "nextPeer", {
              freePeer: freePeer,
              error: "stay",
              peersCount: peersLength,
            });
          } else {
            freePeer = urlMaker();
            await this.sendToPeer(config.peer_id, configs.sockets, "nextPeer", {
              freePeer: freePeer,
              error: "No peer",
              peersCount: peersLength,
            });
          }
        }
      });

      /**
       * Relay actions to peers or specific peer in the same room
       */
      socket.on("peerAction", async (config) => {
        // log.debug('Peer action', config);
        let room_id = config.room_id;
        let peer_id = config.peer_id;
        let peer_name = config.peer_name;
        let peer_use_video = config.peer_use_video;
        let peer_action = config.peer_action;
        let send_to_all = config.send_to_all;

        if (send_to_all) {
          log.debug(
            "[" + socket.id + "] emit peerAction to [room_id: " + room_id + "]",
            {
              peer_id: socket.id,
              peer_name: peer_name,
              peer_action: peer_action,
              peer_use_video: peer_use_video,
            }
          );

          try {
            await this.sendToRoom(room_id, socket.id, "peerAction", {
              peer_id: peer_id,
              peer_name: peer_name,
              peer_action: peer_action,
              peer_use_video: peer_use_video,
            });
          } catch (err) {
            log.error("[ERROR] ", err);
          }
        } else {
          log.debug(
            "[" +
            socket.id +
            "] emit peerAction to [" +
            peer_id +
            "] from room_id [" +
            room_id +
            "]"
          );

          try {
            await this.sendToPeer(peer_id, configs.sockets, "peerAction", {
              peer_id: peer_id,
              peer_name: peer_name,
              peer_action: peer_action,
              peer_use_video: peer_use_video,
            });
          } catch (err) {
            log.error(`Action : peerAction\n Error : ${err}`);
          }
        }
      });

      /**
       * Relay Kick out peer from room
       */

      // understood
      socket.on("kickOut", async (config) => {
        let room_id = config.room_id;
        let peer_id = config.peer_id;
        let peer_name = config.peer_name;

        log.debug(
          "[" +
          socket.id +
          "] kick out peer [" +
          peer_id +
          "] from room_id [" +
          room_id +
          "]"
        );

        await this.sendToPeer(peer_id, configs.sockets, "kickOut", {
          peer_name: peer_name,
        });
      });

      /**
       * Relay File info
       */

      // TODO what's this
      socket.on("fileInfo", async (config) => {
        // log.debug('File info', config);
        let room_id = config.room_id;
        let peer_name = config.peer_name;
        let peer_id = config.peer_id;
        let broadcast = config.broadcast;
        let file = config.file;
        // TODO Why , Do we really need this func
        function bytesToSize(bytes) {
          let sizes = ["Bytes", "KB", "MB", "GB", "TB"];
          if (bytes == 0) return "0 Byte";
          let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
          return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
        }

        log.debug(
          "[" +
          socket.id +
          "] Peer [" +
          peer_name +
          "] send file to room_id [" +
          room_id +
          "]",
          {
            peerName: file.peerName,
            fileName: file.fileName,
            fileSize: bytesToSize(file.fileSize),
            fileType: file.fileType,
            broadcast: broadcast,
          }
        );

        if (broadcast) {
          await this.sendToRoom(room_id, socket.id, "fileInfo", config);
        } else {
          await this.sendToPeer(peer_id, configs.sockets, "fileInfo", config);
        }
      });

      /**
       * Relay video player action
       */
      socket.on("videoPlayer", async (config) => {
        // log.debug('Video player', config);
        let room_id = config.room_id;
        let peer_name = config.peer_name;
        let video_action = config.video_action;
        let video_src = config.video_src;
        let peer_id = config.peer_id;

        let sendConfig = {
          peer_name: peer_name,
          video_action: video_action,
          video_src: video_src,
        };
        let logMe = {
          peer_id: socket.id,
          peer_name: peer_name,
          video_action: video_action,
          video_src: video_src,
        };

        if (peer_id) {
          log.debug(
            "[" +
            socket.id +
            "] emit videoPlayer to [" +
            peer_id +
            "] from room_id [" +
            room_id +
            "]",
            logMe
          );

          await this.sendToPeer(
            peer_id,
            configs.sockets,
            "videoPlayer",
            sendConfig
          );
        } else {
          log.debug(
            "[" +
            socket.id +
            "] emit videoPlayer to [room_id: " +
            room_id +
            "]",
            logMe
          );

          await this.sendToRoom(room_id, socket.id, "videoPlayer", sendConfig);
        }
      });

      /**
       * Object to Json
       * @param {object} data object
       * @returns {json} indent 4 spaces
       */

      // this.checkFreePeersAndMerge(configs.peers, this.sendToPeer);
    }); // end [sockets.on-connect]
  }

  // understood
  async removePeerFrom(channel, socket) {
    if (!(channel in socket.channels)) {
      return log.debug("[" + socket.id + "] [Warning] not in ", channel);
    }
    try {
      delete socket.channels[channel];
      delete configs.channels[channel][socket.id];
      delete configs.peers[channel][socket.id]; // delete peer data from the room

      switch (Object.keys(configs.peers[channel]).length) {
        case 0: // last peer disconnected from the room without room lock & password set
          delete configs.peers[channel];
          break;
        case 2: // last peer disconnected from the room having room lock & password set
          if (
            configs.peers[channel]["lock"] &&
            configs.peers[channel]["password"]
          ) {
            delete configs.peers[channel]; // clean lock and password value from the room
          }
          break;
      }
    } catch (err) {
      log.error("Remove Peer", this.toJson(err));
    }
    log.debug(
      "[removePeerFrom] - connected peers grp by roomId",
      configs.peers
    );

    for (let id in configs.channels[channel]) {
      await configs.channels[channel][id].emit("removePeer", {
        peer_id: socket.id,
      });
      socket.emit("removePeer", { peer_id: id });
      log.debug("[" + socket.id + "] emit removePeer [" + id + "]");
    }
  }

  async sendToPeer(peer_id, sockets, msg, config = {}) {
    if (peer_id in sockets) {
      await sockets[peer_id].emit(msg, config);
      //console.log('Send to peer', { msg: msg, config: config });
    }
  }

  toJson(data) {
    return JSON.stringify(data, null, 4);
  }

  findFreePeer(roomID, last5, typeOfCall) {
    // remove roomID from peers, it may be a key of peers object
    let allChannels = configs.peers;
    delete allChannels[roomID];
    let available = Object.keys(configs.peers).filter(
      (key) => Object.keys(configs.peers[key]).length === 1
    );

    if (available.length > 2) {
      available.pop();
    }
    let newestPeers = available;
    // let newestPeers = available.filter((key) => !last5.includes(key));
    if (newestPeers.length > 0) {
      return newestPeers[Math.floor(Math.random() * newestPeers.length)];
    } else if (available.length > 0 && typeOfCall !== "leftUser") {
      return available[Math.floor(Math.random() * available.length)];
    } else {
      console.log("no available peers");
      return null;
    }
  }

  async sendToRoom(room_id, socket_id, msg, config = {}) {
    for (let peer_id in configs.channels[room_id]) {
      // not send data to myself
      if (peer_id != socket_id) {
        await configs.channels[room_id][peer_id].emit(msg, config);
      }
    }
  }

  /**
   * Add peers to channel
   * @param {string} channel room id
   */

  // understood
  async addPeerTo(channel, socket) {
    for (let id in configs.channels[channel]) {
      // offer false
      await configs.channels[channel][id].emit("addPeer", {
        peer_id: socket.id,
        peers: configs.peers[channel],
        should_create_offer: false,
        iceServers: configs.iceServers,
      });

      // console.log(config.iceServers);
      // offer true
      socket.emit("addPeer", {
        peer_id: id,
        peers: configs.peers[channel],
        should_create_offer: true,
        iceServers: configs.iceServers,
      });
      log.debug("[" + socket.id + "] emit addPeer [" + id + "]");
    }
  }

  checkFreePeersAndMerge(peers, senderFunc) {
    let available;
    console.log("Shu " + peers);
    setInterval(function () {
      available = Object.keys(peers).filter(
        (key) => Object.keys(peers[key]).length === 1
      );
      console.log("available interval", available);

      if (available.length > 1) {
        // send 2nd peer to the first channel
        let firstChannel = available[0];
        let secondChannel = available[1];
        let firstPeer = Object.keys(peers[firstChannel])[0];
        // send 2nd peer to the first channel
        senderFunc(firstPeer, configs.channels[firstChannel], "nextPeer", {
          freePeer: secondChannel,
        });
      }
    }, 20000);
    return available;
  }
};
