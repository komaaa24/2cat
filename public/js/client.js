"use strict"; // https://www.w3schools.com/js/js_strict.asp

const audioDevices = { default: "default", earpiece: "earpiece", speakerphone: "speakerphone", wired: "wired", bluetooth: "bluetooth" }

const isHttps = false; // must be the same on server.js
const signalingServer = getSignalingServer();
const roomId = getRoomId();
const peersAmountUrl = "/api/groupspeer";
const peerLoockupUrl = "https://extreme-ip-lookup.com/json/?key=demo2"; // get your API Key at https://extreme-ip-lookup.com
const avatarApiUrl = "https://eu.ui-avatars.com/api";
const welcomeImg = "../images/image-placeholder.svg";
const shareUrlImg = "../images/image-placeholder.svg";
const confirmImg = "../images/image-placeholder.svg";
const roomLockedImg = "../images/locked.png";
const camOffImg = "../images/cam-off.png";
const audioOffImg = "../images/audio-off.png";
const deleteImg = "../images/delete.png";
const messageImg = "../images/message.png";
const audioGif = "../images/audio.gif";
const videoAudioShare = "../images/va-share.png";
const aboutImg = "../images/about.png";
const imgFeedback = "../images/feedback.png";
const forbiddenImg = "../images/forbidden.png";
const avatarImg = "../images/cameraoff.gif";
const camMicOff = "../images/cam-mic-off.png";
const isWebRTCSupported = DetectRTC.isWebRTCSupported;
const isMobileDevice = DetectRTC.isMobileDevice;
const myBrowserName = DetectRTC.browser.name;
const chatInputEmoji = {
  "<3": "\u2764\uFE0F",
  "</3": "\uD83D\uDC94",
  ":D": "\uD83D\uDE00",
  ":)": "\uD83D\uDE03",
  ";)": "\uD83D\uDE09",
  ":(": "\uD83D\uDE12",
  ":p": "\uD83D\uDE1B",
  ";p": "\uD83D\uDE1C",
  ":'(": "\uD83D\uDE22",
  ":+1:": "\uD83D\uDC4D",
};

const className = {
  user: "fas fa-user",
  clock: "fas fa-clock",
  audioOn: "fas fa-microphone",
  audioOff: "fas fa-microphone-slash",
  videoOn: "fas fa-video",
  videoOff: "fas fa-video-slash",
  screenOn: "fas fa-desktop",
  screenOff: "fas fa-stop-circle",
  handPulsate: "fas fa-hand-paper pulsate",
  privacy: "far fa-circle",
  snapShot: "fas fa-camera-retro",
  pinUnpin: "fas fa-map-pin",
  fullScreen: "fas fa-expand",
  fsOn: "fas fa-compress-alt",
  fsOff: "fas fa-expand-alt",
  msgPrivate: "fas fa-paper-plane",
  shareFile: "fas fa-upload",
  shareVideoAudio: "fab fa-youtube",
  chatOn: "fas fa-comment",
  chatOff: "fas fa-comment-slash",
  ghost: "fas fa-ghost",
  undo: "fas fa-undo",
  trash: "fas fa-trash",
  copy: "fas fa-copy",
  heart: "fas fa-heart",
};

// Show desired buttons captionBtn, showSwapCameraBtn, showScreenShareBtn, showFullScreenBtn -> (auto-detected)
const buttons = {
  main: {
    showShareRoomBtn: false,
    showAudioBtn: true,
    showVideoBtn: false,
    showScreenBtn: false,
    showRecordStreamBtn: false,
    showCaptionRoomBtn: false,
    showMyHandBtn: false,
    showMySettingsBtn: true,
    showAboutBtn: false,
    showmyVideoStatusButton: false,
    showFullScreenBtn: false,
  },
  chat: {
    showSaveMessageBtn: false,
    showMarkDownBtn: false,
    showShareVideoAudioBtn: false,
    showParticipantsBtn: false,
    showNotifyMeBtn: false,
    showPinUnpin: false,
  },
  settings: {
    showTabRoomParticipants: false,
    showTabRoomSecurity: false,
    showMuteEveryoneBtn: false,
    showHideEveryoneBtn: false,
    showLockRoomBtn: false,
    showUnlockRoomBtn: false,
    showThemeBtn: false,
    showLanguageBtn: false,
  },
  remote: {
    showAudioVolume: true,
    audioBtnClickAllowed: false,
    videoBtnClickAllowed: false,
    showSnapShotBtn: true,
    showShareVideoAudioBtn: false,
    showPrivateMessageBtn: false,
    remoteFullScreenStatus: false,
  },
  local: {
    showSnapShotBtn: false,
    showVideoCircleBtn: false,
  },
};

const isRulesActive = true; // Presenter can do anything, guest is slightly moderate, if false no Rules for the room.
const surveyActive = true; // when leaving the room give a feedback, if false will be redirected to newcall page
const forceCamMaxResolutionAndFps = false; // This force the webCam to max resolution, up to 4k and 60fps (very high bandwidth are required) if false, you can set it from settings
const userLimitsActive = true; // Limit users per room
const usersCountLimit = 2; // Limit 2 users per room if userLimitsActive true
const useAvatarApi = true; // if false the cam-Off avatar = avatarImg
let notifyBySound = true; // turn on - off sound notifications
let thisRoomPassword = null;
let isRoomLocked = false;
let isPresenter = false; // Who init the room (aka first peer joined)
let needToEnableMyAudio = false; // On screen sharing end, check if need to enable my audio
let initEnumerateDevicesFailed = false; // Check if user webcam and audio init is failed
let isVideoPrivacyActive = false; // Video circle for privacy
// twice connecting if it fails
let reconnecting = false;

let last5peers = () => {
  return localStorage.getItem("last5peers")
    ? JSON.parse(localStorage.getItem("last5peers"))
    : [];
};

let addToLast5peers = (peerId) => {
  let last5 = last5peers();
  if (last5.length > 4) {
    last5.shift();
  }
  last5.push(peerId);
  localStorage.setItem("last5peers", JSON.stringify(last5));
};

let myPeerId; // socket.id
let peerInfo = {}; // Some peer info
let userAgent; // User agent info

let isTabletDevice = false;
let isIPadDevice = false;
let isVideoFullScreenSupported = true;

// video cam - screen max frame rate
let videoMaxFrameRate = 30;
let screenMaxFrameRate = 30;

let videoQualitySelectedIndex = 0; // default

let leftChatAvatar;
let rightChatAvatar;
let chatMessagesId = 0;

let shouldWelcomeMsgBeShown = false;

let callStartTime;
let callElapsedTime;
let recStartTime;
let recElapsedTime;
let videolifyTheme = "ghost"; // neon - dark - forest - ghost ...
let BtnsBar = "horizontal"; // vertical - horizontal
let pinVideoPositionSelect;
let swalBackground = "#272727"; // black - #16171b - transparent ...
let peerGeo;
let audioOutputBtn;
let myPeerName = getPeerName();
let isScreenEnabled = getScreenEnabled();
let isScreenSharingSupported = false;
let isCamMirrored = false;
let notify = getNotify();
let useAudio = true;
let useVideo = true;
let isEnumerateVideoDevices = false;
let isEnumerateAudioDevices = false;
let camera = window.localStorage.getItem("camera") || "user";
let roomLocked = false;
let myVideoChange = false;
let myHandStatus = false;
let myVideoStatus = false;
let myAudioStatus = false;
let myScreenStatus = false;
let pitchDetectionStatus = false;
let audioContext;
let mediaStreamSource;
let meter;
let isScreenStreaming = false;
let showChatOnMessage = true;
let isChatRoomVisible = false;
let isCaptionBoxVisible = false;
let isChatEmojiVisible = false;
let isChatMarkdownOn = false;
let isButtonsVisible = false;
let isButtonsBarOver = false;
let isMySettingsVisible = false;
let isVideoOnFullScreen = false;
let isDocumentOnFullScreen = false;
let isVideoPinned = false;
let pinnedVideoPlayerId = null;
let isRecScreenStream = false;
let isChatPasteTxt = false;
let needToCreateOffer = false; // after session description answer
let signalingSocket; // socket.io connection to our webserver
let localMediaStream; // my microphone / webcam
let remoteMediaStream; // peers microphone / webcam
let recScreenStream; // recorded screen stream
let remoteMediaControls = false; // enable - disable peers video player controls (default false)
let peerConnection = null; // RTCPeerConnection
let peerConnections = {}; // keep track of our peer connections, indexed by peer_id == socket.io id
let chatDataChannels = {}; // keep track of our peer chat data channels
let fileDataChannels = {}; // keep track of our peer file sharing data channels
let peerMediaElements = {}; // keep track of our peer <video> tags, indexed by peer_id
let chatMessages = []; // collect chat messages to save it later if want
let allPeers = {}; // keep track of all peers in the room, indexed by peer_id == socket.io id
let transcripts = []; //collect all the transcripts to save it later if you need
let backupIceServers = [{ urls: "stun:stun.l.google.com:19302" }]; // backup iceServers
let countTime; // conference count time
let onlineUsersCount; // online users count
// init audio-video
let initAudioBtn;
let initVideoBtn;
// buttons bar
let buttonsBar;
let audioOutputChangeBtn;
let shareRoomBtn;
let audioBtn;
let videoBtn;
let swapCameraBtn;
let fullScreenBtn;
let myHandBtn;
let mySettingsBtn;
let aboutBtn;
let leaveRoomBtn;
let nextBtn;
// chat room elements
let msgerDraggable;
let msgerHeader;
let msgerCPBtn;
let msgerClean;
let msgerSaveBtn;
let msgerClose;
let msgerChat;
let msgerEmojiBtn;
let msgerInput;
let msgerPasteBtn;
let msgerShowChatOnMsg;
let msgerSendBtn;
//caption section
let captionDraggable;
let captionHeader;
let captionClean;
let captionSaveBtn;
let captionClose;
let captionChat;
// chat room connected peers
let msgerCP;
let msgerCPHeader;
let msgerCPCloseBtn;
let msgerCPList;
// chat room emoji picker
let msgerEmojiPicker;
// my settings
let mySettings;
let mySettingsHeader;
let tabDevicesBtn;
// let tabBandwidthBtn;
let tabRoomBtn;
let tabStylingBtn;
let tabLanguagesBtn;
let mySettingsCloseBtn;
let myPeerNameSet;
let myPeerNameSetBtn;
// let switchSounds;
let audioInputSelect;
let audioOutputSelect;
let videoSelect;
let videoQualitySelect;
let videoFpsSelect;
let screenFpsSelect;
let themeSelect;
let videoObjFitSelect;

let btnsBarSelect;
let selectors;
let tabRoomParticipants;
let tabRoomSecurity;
// my video element
let myVideo;
let myVideoWrap;
let myVideoAvatarImage;
// name && hand video audio status
let myVideoParagraph;
let myHandStatusIcon;
let myVideoStatusIcon;
let myAudioStatusIcon;
// record Media Stream
let recordedBlobs;
let isStreamRecording = false;
// room actions btns
let muteEveryoneBtn;
let hideEveryoneBtn;
let lockRoomBtn;
let unlockRoomBtn;
// file transfer settings
let fileToSend;
let fileReader;
let receiveBuffer = [];
let receivedSize = 0;
let incomingFileInfo;
let incomingFileData;
// send form
let sendFileDiv;
let sendFileInfo;
let sendProgress;
let sendAbortBtn;
let sendInProgress = false;
// receive form
let receiveFileDiv;
let receiveFileInfo;
let receiveProgress;
let receiveHideBtn;
let receiveFilePercentage;
let receiveInProgress = false;
// MTU 1kb to prevent drop.
// const chunkSize = 1024;
const chunkSize = 1024 * 16; // 16kb/s
// video URL player
let videoUrlCont;
let videoAudioUrlCont;
let videoUrlHeader;
let videoAudioUrlHeader;
let videoAudioCloseBtn;
let videoUrlIframe;
let videoAudioUrlElement;
// speech recognition
let speechRecognitionIcon;
let speechRecognitionStart;
let speechRecognitionStop;

/**
 * Load all Html elements by Id
 */
function getHtmlElementsById() {
  // top bar status
  onlineUsersCount = getId("onlineUsersCount");
  countTime = getId("countTime");
  // my video
  myVideo = getId("myVideo");
  myVideoWrap = getId("myVideoWrap");
  myVideoAvatarImage = getId("myVideoAvatarImage");
  // buttons Bar
  buttonsBar = getId("buttonsBar");
  audioOutputChangeBtn = getId("audioOutputChangeBtn");
  shareRoomBtn = getId("shareRoomBtn");
  audioBtn = getId("audioBtn");
  videoBtn = getId("videoBtn");
  swapCameraBtn = getId("swapCameraBtn");
  fullScreenBtn = getId("fullScreenBtn");
  myHandBtn = getId("myHandBtn");
  mySettingsBtn = getId("mySettingsBtn");
  aboutBtn = getId("aboutBtn");
  leaveRoomBtn = getId("leaveRoomBtn");
  nextBtn = getId("nextBtn");
  // chat Room elements
  msgerDraggable = getId("msgerDraggable");
  msgerHeader = getId("msgerHeader");
  msgerCPBtn = getId("msgerCPBtn");
  msgerClean = getId("msgerClean");
  msgerSaveBtn = getId("msgerSaveBtn");
  msgerClose = getId("msgerClose");
  msgerChat = getId("msgerChat");
  msgerEmojiBtn = getId("msgerEmojiBtn");
  msgerInput = getId("msgerInput");
  msgerPasteBtn = getId("msgerPasteBtn");
  msgerShowChatOnMsg = getId("msgerShowChatOnMsg");
  msgerSendBtn = getId("msgerSendBtn");
  // chat room connected peers
  msgerCP = getId("msgerCP");
  msgerCPHeader = getId("msgerCPHeader");
  msgerCPCloseBtn = getId("msgerCPCloseBtn");
  msgerCPList = getId("msgerCPList");
  // chat room emoji picker
  msgerEmojiPicker = getId("msgerEmojiPicker");
  //caption box elements
  captionDraggable = getId("captionDraggable");
  captionHeader = getId("captionHeader");
  captionClean = getId("captionClean");
  captionSaveBtn = getId("captionSaveBtn");
  captionClose = getId("captionClose");
  captionChat = getId("captionChat");
  // my settings
  mySettings = getId("mySettings");
  mySettingsHeader = getId("mySettingsHeader");
  tabDevicesBtn = getId("tabDevicesBtn");
  // tabBandwidthBtn = getId("tabBandwidthBtn");
  tabRoomBtn = getId("tabRoomBtn");
  tabStylingBtn = getId("tabStylingBtn");
  tabLanguagesBtn = getId("tabLanguagesBtn");
  mySettingsCloseBtn = getId("mySettingsCloseBtn");
  myPeerNameSet = getId("myPeerNameSet");
  myPeerNameSetBtn = getId("myPeerNameSetBtn");
  // switchSounds = getId("switchSounds");
  audioInputSelect = getId("audioSource");
  audioOutputSelect = getId("audioOutput");
  videoSelect = getId("videoSource");
  videoQualitySelect = getId("videoQuality");
  videoFpsSelect = getId("videoFps");
  screenFpsSelect = getId("screenFps");
  themeSelect = getId("videolifyTheme");
  videoObjFitSelect = getId("videoObjFitSelect");
  pinVideoPositionSelect = getId("pinVideoPositionSelect");
  btnsBarSelect = getId("BtnsBar");
  tabRoomParticipants = getId("tabRoomParticipants");
  tabRoomSecurity = getId("tabRoomSecurity");
  // my conference name, hand, video - audio status
  myVideoParagraph = getId("myVideoParagraph");
  myHandStatusIcon = getId("myHandStatusIcon");
  myVideoStatusIcon = getId("myVideoStatusIcon");
  myAudioStatusIcon = getId("myAudioStatusIcon");
  // room actions buttons
  muteEveryoneBtn = getId("muteEveryoneBtn");
  hideEveryoneBtn = getId("hideEveryoneBtn");
  lockRoomBtn = getId("lockRoomBtn");
  unlockRoomBtn = getId("unlockRoomBtn");
  // file send progress
  sendFileDiv = getId("sendFileDiv");
  sendFileInfo = getId("sendFileInfo");
  sendProgress = getId("sendProgress");
  sendAbortBtn = getId("sendAbortBtn");
  // file receive progress
  receiveFileDiv = getId("receiveFileDiv");
  receiveFileInfo = getId("receiveFileInfo");
  receiveProgress = getId("receiveProgress");
  receiveHideBtn = getId("receiveHideBtn");
  receiveFilePercentage = getId("receiveFilePercentage");
  // video url player
  videoUrlCont = getId("videoUrlCont");
  videoAudioUrlCont = getId("videoAudioUrlCont");
  videoUrlHeader = getId("videoUrlHeader");
  videoAudioUrlHeader = getId("videoAudioUrlHeader");

  videoAudioCloseBtn = getId("videoAudioCloseBtn");
  videoUrlIframe = getId("videoUrlIframe");
  videoAudioUrlElement = getId("videoAudioUrlElement");
  // speech recognition
  speechRecognitionIcon = getId("speechRecognitionIcon");
  speechRecognitionStart = getId("speechRecognitionStart");
  speechRecognitionStop = getId("speechRecognitionStop");
}

/**
 * Using tippy aka very nice tooltip!
 * https://atomiks.github.io/tippyjs/
 */
function setButtonsToolTip() {
  // not need for mobile
  if (isMobileDevice) return;
  // main buttons
  setTippy(audioOutputChangeBtn, "Ovoz portini o'zgartirish", "right-start");
  setTippy(shareRoomBtn, "Taklif qilish", "right-start");
  setTippy(audioBtn, "Ovozni o'chirish", "right-start");
  setTippy(videoBtn, "Videoni yopish", "right-start");
  setTippy(fullScreenBtn, "To'liq ekran ochish", "right-start");
  setTippy(myHandBtn, "Raise hand", "right-start");
  setTippy(mySettingsBtn, "Sozlamalar", "right-start");
  setTippy(aboutBtn, "About", "right-start");
  setTippy(leaveRoomBtn, "Chiqish", "left");
  setTippy(nextBtn, "Keyingisi", "right-start");
  // chat room buttons
  setTippy(msgerCPBtn, "Private messages", "top");
  setTippy(msgerClean, "Xabarlarni o'chirish", "top");
  setTippy(msgerSaveBtn, "Save messages", "top");
  setTippy(msgerClose, "Yopish", "right");
  setTippy(msgerEmojiBtn, "Emoji", "top");
  setTippy(msgerPasteBtn, "Paste", "top");
  setTippy(msgerShowChatOnMsg, "Notify me", "top");
  setTippy(msgerSendBtn, "Yuborish", "top");
  // chat participants buttons
  setTippy(msgerCPCloseBtn, "Yopish", "left");
  // caption buttons
  setTippy(captionClose, "Yopish", "right");
  setTippy(captionClean, "Xabarlarni o'chirish", "top");
  setTippy(captionSaveBtn, "Saqlash", "top");
  // settings
  setTippy(mySettingsCloseBtn, "Yopish", "right");
  setTippy(myPeerNameSetBtn, "Ismni o'zgartirish", "top");
  // tab btns
  setTippy(tabDevicesBtn, "Qurilmalar", "top");
  // setTippy(tabBandwidthBtn, "Internet & Aloqa", "top");
  setTippy(tabRoomBtn, "Xona", "top");
  setTippy(tabStylingBtn, "Mavzu", "top");
  setTippy(tabLanguagesBtn, "Til", "top");
  // room actions btn
  setTippy(muteEveryoneBtn, "Mute everyone except yourself", "top");
  setTippy(hideEveryoneBtn, "Hide everyone except yourself", "top");
  // Suspend/Hide File transfer btn
  setTippy(sendAbortBtn, "Abort file transfer", "right-start");
  setTippy(receiveHideBtn, "Hide file transfer", "right-start");

  setTippy(videoAudioCloseBtn, "audio playerni yopish", "right-start");
  setTippy(onlineUsersCount, "Onlayn foydalanuvchilar", "bottom");
}
// random channel
function urlMaker() {
  let adjectivesUz = ["kichik", "katta", "ulkan"];
  let nounsUz = ["it", "tipratikan", "olma"];
  let randomizedAdjective =
    adjectivesUz[Math.floor(Math.random() * adjectivesUz.length)];
  let randomizedNoun = nounsUz[Math.floor(Math.random() * nounsUz.length)];
  let url = randomizedAdjective + "-" + randomizedNoun;
  return url;
}
/**
 * Set nice tooltip to element
 * @param {object} elem element
 * @param {string} content message to popup
 * @param {string} placement position
 */
function setTippy(elem, content, placement) {
  if (isMobileDevice) return;
  tippy(elem, {
    content: content,
    placement: placement,
  });
}

/**
 * Get peer info using DetecRTC
 * https://github.com/muaz-khan/DetectRTC
 * @returns {object} peer info
 */
function getPeerInfo() {
  return {
    detectRTCversion: DetectRTC.version,
    isWebRTCSupported: DetectRTC.isWebRTCSupported,
    isDesktopDevice:
      !DetectRTC.isMobileDevice && !isTabletDevice && !isIPadDevice,
    isMobileDevice: DetectRTC.isMobileDevice,
    isTabletDevice: isTabletDevice,
    isIPadDevice: isIPadDevice,
    osName: DetectRTC.osName,
    osVersion: DetectRTC.osVersion,
    browserName: DetectRTC.browser.name,
    browserVersion: DetectRTC.browser.version,
  };
}

/**
 * Get approximative peer geolocation
 * Get your API Key at https://extreme-ip-lookup.com
 */
async function getPeerGeoLocation() {
  console.log("07. Get peer geo location");
  fetch(peerLoockupUrl)
    .then((res) => res.json())
    .then((outJson) => {
      peerGeo = outJson;
    })
    .catch((err) => console.warn(err));
}
async function getAllUsersAmount() {
  let onlineUsersCount = document.getElementById("onlineUsersCount");
  onlineUsersCount.innerHTML = "";
  console.log("07.2. Get peers amount");
  fetch(peersAmountUrl)
    .then((res) => res.json())
    .then((outJson) => {
      onlineUsersCount.innerHTML = outJson.users;
    })
    .catch((err) => console.warn(err));
}

/**
 * Get Signaling server URL
 * @returns {string} Signaling server URL
 */
function getSignalingServer() {
  if (isHttps) {
    return "https://" + location.hostname;
  }
  return (
    "http" +
    (location.hostname == "localhost" ? "" : "s") +
    "://" +
    location.hostname
  );
}

/**
 * Generate random Room id if not set
 * @returns {string} Room Id
 */
function getRoomId() {
  let qs = new URLSearchParams(window.location.search);
  let queryRoomId = qs.get("room");

  // skip /join/
  let roomId = queryRoomId ? queryRoomId : location.pathname.substring(6);
  // if not specified room id, create one random
  if (roomId == "") {
    roomId = makeId(20);
    const newUrl = signalingServer + "/join/" + roomId;
    window.history.pushState({ url: newUrl }, roomId, newUrl);
  }
  return roomId;
}

/**
 * Generate random Id
 * @param {integer} length
 * @returns {string} random id
 */
function makeId(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Check if notify is set
 * @returns {boolean} true/false (default true)
 */
function getNotify() {
  let qs = new URLSearchParams(window.location.search);
  let notify = qs.get("notify");
  if (notify) {
    let queryNotify = notify === "1" || notify === "true";
    if (queryNotify != null) return queryNotify;
  }
  return true;
}

/**
 * Check if peer name is set
 * @returns {string} Peer Name
 */
function getPeerName() {
  let qs =
    new URLSearchParams(window.location.search) ||
    window.localStorage.getItem("peer_name") ||
    "Anonymous -" + makeId(3);
  return qs.get("name");
}

/**
 * Is screen enabled on join room
 * @returns {boolean} true/false
 */
function getScreenEnabled() {
  let qs = new URLSearchParams(window.location.search);
  let screen = qs.get("screen");
  if (screen) {
    screen = screen.toLowerCase();
    let queryPeerScreen = screen === "1" || screen === "true";
    return queryPeerScreen;
  }
  return false;
}

/**
 * Check if there is peer connections
 * @returns {boolean} true/false
 */
function thereIsPeerConnections() {
  if (Object.keys(peerConnections).length === 0) return false;
  return true;
}

/**
 * Count the peer connections
 * @returns peer connections count
 */
function countPeerConnections() {
  return Object.keys(peerConnections).length;
}

/**
 * On body load Get started
 */
function initClientPeer() {
  if (!isWebRTCSupported) {
    return userLog("error", "Bu brovser WebRTCni qo'llamaydi!");
  }

  userAgent = navigator.userAgent.toLowerCase();

  isTabletDevice = isTablet(userAgent);
  isIPadDevice = isIpad(userAgent);
  peerInfo = getPeerInfo();

  // check if video Full screen supported on default true
  if (peerInfo.isMobileDevice && peerInfo.osName === "iOS") {
    isVideoFullScreenSupported = false;
  }

  console.log("01. Connecting to signaling server");

  // Disable the HTTP long-polling transport
  signalingSocket = io({ transports: ["websocket"] });

  const transport = signalingSocket.io.engine.transport.name; // in most cases, "polling"
  console.log("02. Connection transport", transport);

  // Check upgrade transport
  signalingSocket.io.engine.on("upgrade", () => {
    const upgradedTransport = signalingSocket.io.engine.transport.name; // in most cases, "websocket"
    console.log("Connection upgraded transport", upgradedTransport);
  });

  // on receiving data from signaling server...
  signalingSocket.on("connect", handleConnect);
  signalingSocket.on("roomAction", handleRoomAction);
  signalingSocket.on("addPeer", handleAddPeer);
  signalingSocket.on("serverInfo", handleServerInfo);
  signalingSocket.on("sessionDescription", handleSessionDescription);
  signalingSocket.on("iceCandidate", handleIceCandidate);
  signalingSocket.on("peerName", handlePeerName);
  signalingSocket.on("peerStatus", handlePeerStatus);
  signalingSocket.on("peerAction", handlePeerAction);
  signalingSocket.on("disconnect", handleDisconnect);
  signalingSocket.on("removePeer", handleRemovePeer);
  signalingSocket.on("nextPeer", handleNextPeer);
}

async function sendToServer(msg, config = {}) {
  await signalingSocket.emit(msg, config);
}

async function sendToDataChannel(config) {
  if (
    thereIsPeerConnections() &&
    typeof config === "object" &&
    config !== null
  ) {
    for (let peer_id in chatDataChannels)
      if (chatDataChannels[peer_id].readyState === "open")
        await chatDataChannels[peer_id].send(JSON.stringify(config));

  }
}

/**
 * Connected to Signaling Server. Once the user has given us access to their
 * microphone/cam, join the channel and start peering up
 */
async function handleConnect() {
  console.log("03. Connected to signaling server");
  myPeerId = signalingSocket.id;
  console.log("04. My peer id [ " + myPeerId + " ]");
  if (localMediaStream) {
    await joinToChannel();
  } else {
    await initEnumerateDevices();
    await setupLocalMedia();
    if (
      localStorage.getItem("peer_name") === null ||
      localStorage.getItem("peer_name") === undefined
    ) {
      await whoAreYou();
    } else {
      whoAreYouJoin();
      joiningPart2();
    }
  }
}

/**
 * Handle some signaling server info
 * @param {object} config data
 */
function handleServerInfo(config) {
  let peers_count = config.peers_count;
  console.log("13. Peers count", peers_count);
  // Limit room to n peers
  if (userLimitsActive && peers_count > usersCountLimit) {
    return roomIsBusy();
  }
  // Let start with some basic rules
  isPresenter = peers_count == 1 ? true : false;
  if (isRulesActive) {
    handleRules(isPresenter);
  }
  if (notify && peers_count == 1 && shouldWelcomeMsgBeShown) {
    welcomeUser();
  }
}

function availableServers(config) {
  console.log("Available servers", config);
}

/**
 * Room is busy, disconnect me and alert the user that
 * will be redirected to home page
 */
function roomIsBusy() {
  fetch("/api/freepeers")
    .then((response) => response.json())
    .then((data) => {
      openURL("/join/" + data.freePeer);
    });
}

/**
 * Presenter can do anything, for others you can limit
 * some functions by hidden the buttons etc.
 * @param {boolean} isPresenter true/false
 */
function handleRules(isPresenter) {
  console.log("14. Peer isPresenter: " + isPresenter);
  if (!isPresenter) {
    buttons.settings.showTabRoomParticipants = false;
    buttons.settings.showTabRoomSecurity = false;
    buttons.remote.audioBtnClickAllowed = false;
    buttons.remote.videoBtnClickAllowed = false;
  } else {
    buttons.settings.showTabRoomParticipants = false;
    buttons.settings.showTabRoomSecurity = false;
    buttons.settings.showLockRoomBtn = false;
    buttons.settings.showUnlockRoomBtn = false;
    buttons.remote.audioBtnClickAllowed = false;
    buttons.remote.videoBtnClickAllowed = false;
  }
  handleButtonsRule();
}
/**
 * Hide not desired buttons
 */
function handleButtonsRule() {
  // Main
  elemDisplay(shareRoomBtn, buttons.main.showShareRoomBtn);
  elemDisplay(audioBtn, buttons.main.showAudioBtn);
  elemDisplay(videoBtn, buttons.main.showVideoBtn);
  elemDisplay(myHandBtn, buttons.main.showMyHandBtn);
  //elemDisplay(mySettingsBtn, buttons.main.showMySettingsBtn);
  elemDisplay(aboutBtn, buttons.main.showAboutBtn);
  elemDisplay(fullScreenBtn, buttons.main.showFullScreenBtn);
  // chat
  elemDisplay(msgerSaveBtn, buttons.chat.showSaveMessageBtn);
  elemDisplay(msgerCPBtn, buttons.chat.showParticipantsBtn);
  elemDisplay(msgerShowChatOnMsg, buttons.chat.showNotifyMeBtn);
  // Settings
  elemDisplay(muteEveryoneBtn, buttons.settings.showMuteEveryoneBtn);
  elemDisplay(hideEveryoneBtn, buttons.settings.showHideEveryoneBtn);
  elemDisplay(lockRoomBtn, buttons.settings.showLockRoomBtn);
  elemDisplay(unlockRoomBtn, buttons.settings.showUnlockRoomBtn);
  elemDisplay(tabRoomParticipants, buttons.settings.showTabRoomParticipants);
  elemDisplay(tabRoomSecurity, buttons.settings.showTabRoomSecurity);
  elemDisplay(tabStylingBtn, buttons.settings.showThemeBtn);
  elemDisplay(tabLanguagesBtn, buttons.settings.showLanguageBtn);
}
/**
 * set your name for the conference
 */
async function whoAreYou() {
  console.log("11. Who are you?");
  if (myPeerName) {
    checkPeerAudioVideo();
    whoAreYouJoin();
    playSound("addPeer");
    return;
  }

  Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    background: swalBackground,
    position: "center",
    title: "Ismingizni kiriting",
    input: "text",
    inputValue: window.localStorage.peer_name
      ? window.localStorage.peer_name
      : "",
    html: `<br>
        <div style="padding: 10px;">
        <button id="initAudioBtn" class="${className.audioOn}" onclick="handleAudio(event, true)"></button>
        <button id="initVideoBtn" class="${className.videoOn}" onclick="handleVideo(event, true)"></button>
        </div>`,
    confirmButtonText: `Qo'shilish`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
    inputValidator: (value) => {
      if (!value) return "Ismingizni kiriting, iltimos";
      myPeerName = value;
      window.localStorage.peer_name = myPeerName;
      whoAreYouJoin();
    },
  }).then(() => {
    // playSound("addPeer");
  });
  joiningPart2();
}
function joiningPart2() {
  if (isMobileDevice) return;

  initAudioBtn = getId("initAudioBtn");
  initVideoBtn = getId("initVideoBtn");
  if (!useVideo) {
    initVideoBtn.className = className.videoOff;
    setMyVideoStatus(useVideo);
  }
  if (!useAudio) {
    initAudioBtn.className = className.audioOff;
    setMyAudioStatus(useAudio);
  }
  setTippy(initAudioBtn, "Ovozni o'chirish", "top");
  setTippy(initVideoBtn, "Videoni yopish", "top");
}
/**
 * Check peer audio and video &audio=1&video=1
 * 1/true = enabled / 0/false = disabled
 */
function checkPeerAudioVideo() {
  let qs = new URLSearchParams(window.location.search);
  let audio = qs.get("audio");
  let video = qs.get("video");
  if (audio) {
    audio = audio.toLowerCase();
    let queryPeerAudio = audio === "1" || audio === "true";
    if (queryPeerAudio != null) handleAudio(audioBtn, false, queryPeerAudio);
  }
  if (video) {
    video = video.toLowerCase();
    let queryPeerVideo = video === "1" || video === "true";
    if (queryPeerVideo != null) handleVideo(videoBtn, false, queryPeerVideo);
  }
}
/**
 * Room and Peer name are ok Join Channel
 */
function whoAreYouJoin() {
  myVideoWrap.style.display = "inline";
  myVideoParagraph.innerHTML =
    (myPeerName || window.localStorage.getItem("peer_name")) + " (me)";
  myVideoParagraph.innerHTML =
    myPeerName || window.localStorage.getItem("peer_name");
  setPeerAvatarImgName("myVideoAvatarImage", useAvatarApi);
  setPeerChatAvatarImgName("right", myPeerName);
  joinToChannel();
  setTheme(videolifyTheme);
}


/**
 * join to channel and send some peer info
 */
async function joinToChannel() {
  console.log("12. join to channel", roomId);
  sendToServer("join", {
    channel: roomId,
    userAgent: userAgent,
    channel_password: thisRoomPassword,
    peer_info: peerInfo,
    peer_geo: peerGeo,
    peer_name:
      myPeerName || window.localStorage.getItem("peer_name") || "Mehmon",
    peer_video: useVideo,
    peer_audio: useAudio,
    peer_video_status: myVideoStatus,
    peer_audio_status: myAudioStatus,
    peer_screen_status: myScreenStatus,
    peer_hand_status: myHandStatus,
    peer_rec_status: isRecScreenStream,
    peer_privacy_status: isVideoPrivacyActive,
  });
}

/**
 * welcome message
 */
function welcomeUser() {
  const myRoomUrl = window.location.href;
  // playSound("newMessage");
  Swal.fire({
    background: swalBackground,
    position: "center",
    title:
      "<strong>Xush kelibsiz, " + (myPeerName || "foydalanuvchi") + "</strong>",
    imageAlt: "Welcome",
    imageUrl: welcomeImg,
    html:
      `
        <br/> 
        <p style="color:white;">Share this meeting invite for more peers to join.</p>
        <p style="color:rgb(8, 189, 89);">` +
      myRoomUrl +
      `</p>`,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: `Copy URL`,
    denyButtonText: `Email invite`,
    cancelButtonText: `Close`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      copyRoomURL();
    } else if (result.isDenied) {
      let message = {
        email: "",
        subject: "Please join our Videochat conference",
        body: "Click to join: " + myRoomUrl,
      };
      shareRoomByEmail(message);
    }
  });
}

/**
 * When we join a group, our signaling server will send out 'addPeer' events to each pair of users in the group (creating a fully-connected graph of users,
 * ie if there are 6 people in the channel you will connect directly to the other 5, so there will be a total of 15 connections in the network).
 * @param {object} config data
 */
async function handleAddPeer(config) {
  let peer_id = config.peer_id;
  let peers = config.peers;
  let peer_name = peers[peer_id]["peer_name"];
  let peer_video = peers[peer_id]["peer_video"];
  let should_create_offer = config.should_create_offer;
  let iceServers = config.iceServers;
  if (peer_id in peerConnections) {
    // This could happen if the user joins multiple channels where the other peer is also in.
    return console.log("Already connected to peer", peer_id);
  }

  if (!iceServers) iceServers = backupIceServers;
  console.log("iceServers", iceServers);
  peerConnection = new RTCPeerConnection({ iceServers: iceServers });
  peerConnections[peer_id] = peerConnection;
  allPeers = peers;
  console.log("[RTCPeerConnection] - PEER_ID", peer_id); // the connected peer_id
  console.log("[RTCPeerConnection] - PEER-CONNECTIONS", peerConnections); // all peers connections in the room expect myself
  console.log("[RTCPeerConnection] - PEERS", peers); // all peers in the room
  // As P2P check who I am connected with
  let connectedPeersName = [];
  for (let peer_id in peerConnections) {
    connectedPeersName.push({
      peer_name: peers[peer_id]["peer_name"],
    });
  }
  console.log(
    "[RTCPeerConnection] - CONNECTED TO",
    JSON.stringify(connectedPeersName)
  );
  addToLast5peers({ peer_id: peer_id, peer_name: peer_name });
  await handlePeersConnectionStatus(peer_id);
  await msgerAddPeers(peers);
  await handleOnIceCandidate(peer_id);
  await handleRTCDataChannels(peer_id);
  await handleOnTrack(peer_id, peers);
  await handleAddTracks(peer_id);
  if (useVideo && !peer_video && !needToCreateOffer) {
    needToCreateOffer = true;
  }
  if (should_create_offer) {
    await handleRtcOffer(peer_id);
    console.log("[RTCPeerConnection] - SHOULD CREATE OFFER", {
      peer_id: peer_id,
      peer_name: peer_name,
    });
  }
  playSound("addPeer");
}
/**
 * Handle peers connection state
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionstatechange_event
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState
 * @param {string} peer_id socket.id
 */
async function handlePeersConnectionStatus(peer_id) {
  peerConnections[peer_id].onconnectionstatechange = function (event) {
    console.log("EVENTT", event);
    const connectionStatus = event.currentTarget.connectionState;
    const signalingState = event.currentTarget.signalingState;
    const peerName = allPeers[peer_id]["peer_name"];
    console.log("[RTCPeerConnection] - CONNECTION", {
      peer_id: peer_id,
      peer_name: peerName,
      connectionStatus: connectionStatus,
      signalingState: signalingState,
    });
    if (connectionStatus == "connecting") {
      // play loading video
      let remoteAvatarImg = document.getElementById(peer_id + "_avatar");
      remoteAvatarImg.style.display = "block";
      remoteAvatarImg.src = "../images/loading.gif";
    } else if (connectionStatus == "connected") {
      let remoteAvatarImg = document.getElementById(peer_id + "_avatar");
      remoteAvatarImg.style.display = "none";
    } else if (connectionStatus === "failed") {
      if (reconnecting) {
        nextPeer();
      } else {
        reconnecting = true;
        peerConnections[peer_id].restartIce();
      }
    }
  };
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onicecandidate
 * @param {string} peer_id socket.id
 */
async function handleOnIceCandidate(peer_id) {
  peerConnections[peer_id].onicecandidate = (event) => {
    if (!event.candidate) return;
    sendToServer("relayICE", {
      peer_id: peer_id,
      ice_candidate: {
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
      },
    });
  };
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack
 * @param {string} peer_id socket.id
 * @param {object} peers all peers info connected to the same room
 */
async function handleOnTrack(peer_id, peers) {
  console.log("[ON TRACK] - peer_id", { peer_id: peer_id });
  peerConnections[peer_id].ontrack = (event) => {
    let remoteVideoStream = getId(peer_id + "_video");
    let peer_name = peers[peer_id]["peer_name"];
    let kind = event.track.kind;
    if (event.streams && event.streams[0]) {
      console.log("[ON TRACK] - peers", peers);
      remoteVideoStream
        ? attachMediaStream(remoteVideoStream, event.streams[0])
        : loadRemoteMediaStream(event.streams[0], peers, peer_id);
    } else {
      console.log("[ON TRACK] - SCREEN SHARING", {
        peer_id: peer_id,
        peer_name: peer_name,
        kind: kind,
      });
      // attach newStream with screen share video and audio already existing
      let inboundStream = new MediaStream([
        event.track,
        remoteVideoStream.srcObject.getAudioTracks()[0],
      ]);
      attachMediaStream(remoteVideoStream, inboundStream);
    }
  };
}

/**
 * Add my localMediaStream Tracks to connected peer
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addTrack
 * @param {string} peer_id socket.id
 */
async function handleAddTracks(peer_id) {
  let peer_name = allPeers[peer_id]["peer_name"];
  await localMediaStream.getTracks().forEach((track) => {
    peerConnections[peer_id].addTrack(track, localMediaStream);
  });
}

/**
 * Secure RTC Data Channel
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ondatachannel
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/onmessage
 * @param {string} peer_id socket.id
 */
async function handleRTCDataChannels(peer_id) {
  peerConnections[peer_id].ondatachannel = (event) => {
    console.log("handleRTCDataChannels " + peer_id, event);
    event.channel.onmessage = (msg) => {
      switch (event.channel.label) {
        case "videolify_chat_channel":
          try {
            let dataMessage = JSON.parse(msg.data);
            switch (dataMessage.type) {
              case "chat":
                handleDataChannelChat(dataMessage);
                break;
              case "micVolume":
                handlePeerVolume(dataMessage);
                break;
            }
          } catch (err) {
            console.error("videolify_chat_channel", err);
          }
          break;
        case "videolify_file_sharing_channel":
          try {
            let dataFile = msg.data;
            handleDataChannelFileSharing(dataFile);
          } catch (err) {
            console.error("videolify_file_sharing_channel", err);
          }
          break;
      }
    };
  };
  createChatDataChannel(peer_id);
  createFileSharingDataChannel(peer_id);
}

/**
 * Only one side of the peer connection should create the offer, the signaling server picks one to be the offerer.
 * The other user will get a 'sessionDescription' event and will create an offer, then send back an answer 'sessionDescription' to us
 * @param {string} peer_id socket.id
 */
async function handleRtcOffer(peer_id) {
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onnegotiationneeded
  peerConnections[peer_id].onnegotiationneeded = () => {
    console.log("Creating RTC offer to " + allPeers[peer_id]["peer_name"]);
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
    peerConnections[peer_id]
      .createOffer()
      .then((local_description) => {
        console.log("Local offer description is", local_description);
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setLocalDescription
        peerConnections[peer_id]
          .setLocalDescription(local_description)
          .then(() => {
            sendToServer("relaySDP", {
              peer_id: peer_id,
              session_description: local_description,
            });
            console.log("Offer setLocalDescription done!");
          })
          .catch((err) => {
            console.error("[Error] offer setLocalDescription", err);
            userLog("error", "Offer setLocalDescription failed " + err);
          });
      })
      .catch((err) => {
        console.error("[Error] sending offer", err);
      });
  };
}
/**
 * Peers exchange session descriptions which contains information about their audio / video settings and that sort of stuff. First
 * the 'offerer' sends a description to the 'answerer' (with type "offer"), then the answerer sends one back (with type "answer").
 * @param {object} config data
 */
function handleSessionDescription(config) {
  console.log("Remote Session Description", config);

  let peer_id = config.peer_id;
  let remote_description = config.session_description;
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCSessionDescription
  let description = new RTCSessionDescription(remote_description);
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setRemoteDescription
  peerConnections[peer_id]
    .setRemoteDescription(description)
    .then(() => {
      console.log("setRemoteDescription done!");
      if (remote_description.type == "offer") {
        console.log("Creating answer");
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
        peerConnections[peer_id]
          .createAnswer()
          .then((local_description) => {
            console.log("Answer description is: ", local_description);
            // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setLocalDescription
            peerConnections[peer_id]
              .setLocalDescription(local_description)
              .then(() => {
                sendToServer("relaySDP", {
                  peer_id: peer_id,
                  session_description: local_description,
                });
                if (needToCreateOffer) {
                  needToCreateOffer = false;
                  handleRtcOffer(peer_id);
                }
              })
              .catch((err) => {
                console.error("[Error] answer setLocalDescription", err);
              });
          })
          .catch((err) => {
            console.error("[Error] creating answer", err);
          });
      }
    })
    .catch((err) => {
      console.error("[Error] setRemoteDescription", err);
    });
}
/**
 * The offerer will send a number of ICE Candidate blobs to the answerer so they
 * can begin trying to find the best path to one another on the net.
 * @param {object} config data
 */
function handleIceCandidate(config) {
  let peer_id = config.peer_id;
  let ice_candidate = config.ice_candidate;
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate
  peerConnections[peer_id]
    .addIceCandidate(new RTCIceCandidate(ice_candidate))
    .catch((err) => {
      console.error("[Error] addIceCandidate", err);
    });
}
/**
 * Disconnected from Signaling Server.
 * Tear down all of our peer connections and remove all the media divs.
 * @param {object} reason of disconnection
 */
function handleDisconnect(reason) {
  console.log("Disconnected from signaling server", { reason: reason });
  for (let peer_id in peerMediaElements) {
    peerMediaElements[peer_id].parentNode.removeChild(
      peerMediaElements[peer_id]
    );
    adaptAspectRatio();
  }
  for (let peer_id in peerConnections) {
    peerConnections[peer_id].close();
    msgerRemovePeer(peer_id);
    removeVideoPinMediaContainer(peer_id);
  }
  chatDataChannels = {};
  fileDataChannels = {};
  peerConnections = {};
  peerMediaElements = {};
}
function handleRemovePeer(config) {
  let peer_id = config.peer_id;
  if (peer_id in peerMediaElements) {
    peerMediaElements[peer_id].parentNode.removeChild(
      peerMediaElements[peer_id]
    );
    adaptAspectRatio();
  }
  if (peer_id in peerConnections) peerConnections[peer_id].close();
  msgerRemovePeer(peer_id);
  removeVideoPinMediaContainer(peer_id);
  delete chatDataChannels[peer_id];
  delete fileDataChannels[peer_id];
  delete peerConnections[peer_id];
  delete peerMediaElements[peer_id];
  delete allPeers[peer_id];
  isPresenter = !thereIsPeerConnections();
  if (isRulesActive && isPresenter) {
    console.log("I am alone in the room, got Presenter Rules");
    handleRules(isPresenter);
  }
  console.log("ALL PEERS", allPeers);
  if (Object.keys(allPeers).length == 2) {
    console.log("2 ta suhbatdosh bor");
  } else {
    setTimeout(() => {
      nextPeer("leftUser");
    }, 1000);
  }
}

function handleNextPeer(config) {
  if (config.error == "No peer") {
    setTimeout(() => {
      openURL("/join/" + config.freePeer);
      console.log("no free peer found");
    }, 1000)
  }
  else if (config.error == 'stay') {
    console.log("Stay in room");
  } else {
    openURL("/join/" + config.freePeer);
  }
}

/**
 * Set Videochat theme | dark | grey | ...
 * @param {string} theme type
 */
function setTheme(theme) {
  if (!theme) return;
  videolifyTheme = theme;
  switch (videolifyTheme) {
    case "neon":
      // neon theme
      swalBackground = "rgba(0, 0, 0)";
      document.documentElement.style.setProperty("--body-bg", "#000000");
      document.documentElement.style.setProperty(
        "--msger-bg",
        "radial-gradient(circle at 52.1% -29.6%, rgb(144, 17, 105) 0%, rgb(51, 0, 131) 100.2%)"
      );
      document.documentElement.style.setProperty("--msger-private-bg", "black");
      document.documentElement.style.setProperty("--left-msg-bg", "#7d1ac5");
      document.documentElement.style.setProperty("--private-msg-bg", "#f700ff");
      document.documentElement.style.setProperty("--right-msg-bg", "#b612bd");
      document.documentElement.style.setProperty("--wb-bg", "#000");
      document.documentElement.style.setProperty("--wb-hbg", "#4e7596");
      document.documentElement.style.setProperty("--btn-bg", "rgb(44, 48, 85)");
      document.documentElement.style.setProperty(
        "--btn-color",
        "rgb(0, 255, 149)"
      );
      document.documentElement.style.setProperty("--btn-opc", "1");
      document.documentElement.style.setProperty("--btns-left", "20px");
      document.documentElement.style.setProperty(
        "--my-settings-label-color",
        "rgb(0, 140, 255)"
      );
      document.documentElement.style.setProperty(
        "--box-shadow",
        "3px 3px 6px #00bfff, -3px -3px 6px #ba55d3"
      );
      break;
    case "dark":
      // dark theme
      swalBackground = "rgba(0, 0, 0)";
      document.documentElement.style.setProperty("--body-bg", "#16171b");
      document.documentElement.style.setProperty(
        "--msger-bg",
        "radial-gradient( #383838, #000000)"
      );
      document.documentElement.style.setProperty(
        "--msger-private-bg",
        "rgb(18, 82, 141)"
      );
      document.documentElement.style.setProperty("--left-msg-bg", "#474953");
      document.documentElement.style.setProperty("--private-msg-bg", "#f77070");
      document.documentElement.style.setProperty("--right-msg-bg", "#0a0b0c");
      document.documentElement.style.setProperty("--wb-bg", "#000");
      document.documentElement.style.setProperty("--wb-hbg", "#102f49");
      document.documentElement.style.setProperty("--btn-bg", "black");
      document.documentElement.style.setProperty("--btn-color", "white");
      document.documentElement.style.setProperty("--btn-opc", "1");
      document.documentElement.style.setProperty("--btns-left", "20px");
      document.documentElement.style.setProperty(
        "--my-settings-label-color",
        "limegreen"
      );
      document.documentElement.style.setProperty(
        "--box-shadow",
        "3px 3px 6px #0a0b0c, -3px -3px 6px #222328"
      );
      break;
    case "forest":
      // forest theme
      swalBackground = "rgba(0, 0, 0)";
      document.documentElement.style.setProperty("--body-bg", "black");
      document.documentElement.style.setProperty(
        "--msger-bg",
        "linear-gradient(to right, rgb(52, 232, 158), rgb(15, 52, 67))"
      );
      document.documentElement.style.setProperty("--msger-private-bg", "black");
      document.documentElement.style.setProperty("--left-msg-bg", "#4d8051");
      document.documentElement.style.setProperty("--private-msg-bg", "#008cff");
      document.documentElement.style.setProperty("--right-msg-bg", "#2f7210");
      document.documentElement.style.setProperty("--wb-bg", "#000");
      document.documentElement.style.setProperty("--wb-hbg", "#5c964e");
      document.documentElement.style.setProperty("--btn-bg", "white");
      document.documentElement.style.setProperty("--btn-color", "black");
      document.documentElement.style.setProperty("--btn-opc", "1");
      document.documentElement.style.setProperty("--btns-left", "20px");
      document.documentElement.style.setProperty(
        "--my-settings-label-color",
        "limegreen"
      );
      document.documentElement.style.setProperty(
        "--box-shadow",
        "3px 3px 6px #00ff5e, -3px -3px 6px #5eff00"
      );
      break;
    case "ghost":
      // ghost theme
      swalBackground = "rgba(0, 0, 0, 0.150)";
      document.documentElement.style.setProperty("--body-bg", "black");
      document.documentElement.style.setProperty("--msger-bg", "#00000059");
      document.documentElement.style.setProperty("--msger-private-bg", "black");
      document.documentElement.style.setProperty("--wb-bg", "#000");
      document.documentElement.style.setProperty("--wb-hbg", "#102f49");
      document.documentElement.style.setProperty("--btn-bg", "transparent");
      document.documentElement.style.setProperty("--btn-color", "white");
      document.documentElement.style.setProperty("--btn-opc", "0.7");
      document.documentElement.style.setProperty("--btns-left", "20px");
      document.documentElement.style.setProperty("--box-shadow", "0px");
      document.documentElement.style.setProperty(
        "--my-settings-label-color",
        "limegreen"
      );
      document.documentElement.style.setProperty(
        "--left-msg-bg",
        "rgba(0, 0, 0, 0.7)"
      );
      document.documentElement.style.setProperty(
        "--private-msg-bg",
        "rgba(252, 110, 110, 0.7)"
      );
      document.documentElement.style.setProperty(
        "--right-msg-bg",
        "rgba(0, 0, 0, 0.7)"
      );
      break;
    default:
      console.log("No theme found");
  }
  setButtonsBarPosition(BtnsBar);
}

/**
 * Set buttons bar position
 * @param {string} position vertical / horizontal
 */
function setButtonsBarPosition(position) {
  if (!position || isMobileDevice) return;

  BtnsBar = position;
  switch (BtnsBar) {
    case "vertical":
      document.documentElement.style.setProperty("--btns-top", "50%");
      document.documentElement.style.setProperty("--btns-right", "0px");
      document.documentElement.style.setProperty("--btns-left", "15px");
      document.documentElement.style.setProperty("--btns-margin-left", "0px");
      document.documentElement.style.setProperty("--btns-width", "40px");
      document.documentElement.style.setProperty(
        "--btns-flex-direction",
        "column"
      );
      break;
    case "horizontal":
      document.documentElement.style.setProperty("--btns-top", "95%");
      document.documentElement.style.setProperty("--btns-right", "25%");
      document.documentElement.style.setProperty("--btns-left", "50%");
      document.documentElement.style.setProperty(
        "--btns-margin-left",
        "-300px"
      );
      document.documentElement.style.setProperty("--btns-width", "600px");
      document.documentElement.style.setProperty(
        "--btns-flex-direction",
        "row"
      );
      break;
    default:
      console.log("No position found");
  }
}
/**
 * Init to enumerate the devices
 */
async function initEnumerateDevices() {
  console.log("05. init Enumerate Devices");
  await initEnumerateAudioDevices();
  await initEnumerateVideoDevices();
  if (!useAudio && !useVideo) {
    initEnumerateDevicesFailed = true;
    await Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: "#000000",
      position: "center",
      imageUrl: camMicOff,
      title: "Kamera va mikrofonga ruxsat berilmagan",
      text: "Iltimos, kamera va mikrofonga ruxsat bering va saytdan kirishni qayta urinib ko'ring.",
      showDenyButton: false,
      confirmButtonText: `OK`,
      showClass: {
        popup: "animate__animated animate__fadeInDown",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        openURL("/"); // back to homepage
      }
    });
  }
}

/**
 * Init to enumerate the audio devices
 * @returns boolean true/false
 */
async function initEnumerateAudioDevices() {
  if (isEnumerateAudioDevices) return;
  // allow the audio
  await navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      enumerateAudioDevices(stream);
      useAudio = true;
    })
    .catch(() => {
      useAudio = false;
    });
}

/**
 * Init to enumerate the vide devices
 * @returns boolean true/false
 */
async function initEnumerateVideoDevices() {
  if (isEnumerateVideoDevices) return;
  // allow the video
  await navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      enumerateVideoDevices(stream);
      useVideo = true;
    })
    .catch(() => {
      useVideo = false;
    });
}
/**
 * Enumerate Audio
 * @param {object} stream
 */
function enumerateAudioDevices(stream) {
  console.log("06. Get Audio Devices");
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        let el = null;
        let speakerElement = null;
        if ("audioinput" === device.kind) {
          el = getId("audioSource");
          speakerElement = getId("audioDeviceOptions");
        } else if ("audiooutput" === device.kind) {
          console.log(device.kind, device.label);
          el = getId("audioOutput");
        }
        if (!el) return;
        addChild(device, el, device.kind);
        if (speakerElement) addChildSpeaker(device, speakerElement, device.kind);
      });
    })
    .then(() => {
      stopTracks(stream);
      isEnumerateAudioDevices = true;
      getId("audioOutput").disabled = !("sinkId" in HTMLMediaElement.prototype);
    });
}
/**
 * Enumerate Video
 * @param {object} stream
 */
function enumerateVideoDevices(stream) {
  camera = localStorage.getItem("camera") || "user";
  console.log("07. Get Video Devices");
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) =>
      devices.forEach((device) => {
        let el = null;
        if ("videoinput" === device.kind) {
          el = getId("videoSource");
          console.log(device.kind, device.label);
        }
        if (!el) return;
        addChild(device, el, device.kind);
      })
    )
    .then(() => {
      stopTracks(stream);
      isEnumerateVideoDevices = true;
    });
}

/**
 * Stop tracks from stream
 * @param {object} stream
 */
function stopTracks(stream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Add child to element
 * @param {object} device
 * @param {object} el
 * @param {string} kind audio/video
 */
function addChild(device, el, kind) {
  const option = document.createElement("option");
  option.value = device.deviceId;
  let isRussian = device.label == 'По умолчанию';
  let deviceType = identifyDevice(device.label);
  switch (kind) {
    case "videoinput":
      option.text = `📹 ` + device.label || `📹 camera ${el.length + 1}`;
      break;
    case "audioinput":
      if (isRussian || deviceType == audioDevices.default) {
        option.text = `🔈 Default`;
        break;
      }
      option.text = `🎤 ` + device.label || `🎤 microphone ${el.length + 1}`;
      break;
    case "audiooutput":
      option.text = `🔈 ` + device.label || `🔈 speaker ${el.length + 1}`;
      break;
  }
  el.appendChild(option);
  selectors = [
    getId("audioSource"),
    getId("audioOutput"),
    getId("videoSource"),
  ];
}

function addChildSpeaker(device, el, kind) {
  const option = document.createElement("button");
  option.value = device.deviceId;
  option.classList.add("audioOptionBtn");
  const deviceType = identifyDevice(device.label);
  switch (deviceType) {
    case audioDevices.bluetooth:
      option.textContent = `ᛒ ` + device.label || `📹 camera ${el.length + 1}`;
      break;
    case audioDevices.earpiece:
      option.textContent = `📞 ` + device.label || `📹 camera ${el.length + 1}`;
      break;
    case audioDevices.default:
      option.textContent = `🔈 Default` || `🎤 microphone ${el.length + 1}`;
      break;
    case audioDevices.wired:
      option.textContent = `🎧 ` + device.label || `🔈 speaker ${el.length + 1}`;
      break;
    case audioDevices.speakerphone:
      option.textContent = `🔊 ` + device.label || `🔈 speaker ${el.length + 1}`;
      break;
  }
  el.appendChild(option);
  selectors = [
    getId("audioSource"),
    getId("audioOutput"),
    getId("videoSource"),
  ];
}


function handleAudioDeviceBtn() {
  const audioDevicesBtns = document.querySelectorAll(".audioOptionBtn");
  audioDevicesBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      let allInputDevicesLength = audioInputSelect.options.length;

      // logger("All input devices ", audioInputSelect.options);
      if (allInputDevicesLength == 1) {
        return console.log("No audio input devices found");
      }

      let currentIndex = audioInputSelect.selectedIndex;

      let pressedBtn = identifyDevice(btn.textContent);
      for (let i = 0; i < audioInputSelect.options.length; i++) {
        let str = audioInputSelect.options[i].text;
        let deviceType = identifyDevice(str);
        if (deviceType == pressedBtn) {
          currentIndex = i;
        }
      }
      audioInputSelect.selectedIndex = currentIndex;

      const selectedOption = audioInputSelect.options[currentIndex];
      const deviceType = identifyDevice(selectedOption.innerText);

      refreshLocalMedia_only_audio();

      updateVolumeIcon(deviceType);

      localStorage.setItem("volumeIcon", deviceType);

      showAudioDevices("false");

      // const modal = getId("audioDeviceOptions");

      // modal.style.display = "none"

      // localStorage.setItem("speakerOptionBtn", "false");

      // save audio output device to localstorage
      localStorage.setItem("audioInputSelect", audioInputSelect.value);

      return;
    })
  })
}


/**
 * Setup local media stuff. Ask user for permission to use the computers microphone and/or camera,
 * attach it to an <audio> or <video> tag if they give us access.
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
async function setupLocalMedia() {
  // if we've already been initialized do nothing or there is error on initEnumerateDevicesFailed
  if (localMediaStream != null || initEnumerateDevicesFailed) {
    console.log("Local media stream already initialized.");
    return;
  }
  await getPeerGeoLocation();
  await getAllUsersAmount();

  // default | qvgaVideo | vgaVideo | hdVideo | fhdVideo | 2kVideo | 4kVideo |
  let videoConstraints = useVideo ? getVideoConstraints("default") : false;
  let audioConstraints = useAudio;
  if (useAudio) {
    audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    };
  }
  const constraints = {
    audio: audioConstraints,
    video: videoConstraints,
  };
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (stream) {
      await loadLocalMedia(stream);
      await startPitchDetection(stream);
    }
  } catch (err) {
    console.error("[Error] - Access denied for audio - video device", err);
    openURL(
      `/permission?roomId=${roomId}&getUserMediaError=${err.toString()} <br/> Check the common getusermedia errors <a href="https://blog.addpipe.com/common-getusermedia-errors" target="_blank">here<a/>`
    );
  }
}

/**
 * Load Local Media Stream obj
 * @param {object} stream media stream audio - video
 */
async function loadLocalMedia(stream) {
  console.log("10. Access granted to audio - video device");
  // hide loading div
  getId("loadingDiv").style.display = "none";
  localMediaStream = stream;
  console.log("LOAD LOCAL MEDIA STREAM TRACKS", localMediaStream.getTracks());
  let localStorageCamera = localStorage.getItem("camera") || "user";
  if (localStorageCamera !== "user") swapCameraTo(localStorageCamera);
  // local video elemets
  const myVideoWrap = document.createElement("div");
  const myLocalMedia = document.createElement("video");

  // html elements
  const myVideoNavBar = document.createElement("div");
  const myCountTime = document.createElement("button");
  const myPeerName = document.createElement("p");
  const myHandStatusIcon = document.createElement("button");
  const myVideoToImgBtn = document.createElement("button");
  const myPrivacyBtn = document.createElement("button");
  const myVideoStatusIcon = document.createElement("button");
  const myAudioStatusIcon = document.createElement("button");
  const myVideoFullScreenBtn = document.createElement("button");
  const myVideoPinBtn = document.createElement("button");
  const myVideoAvatarImage = document.createElement("img");
  const myPitchMeter = document.createElement("div");
  const myPitchBar = document.createElement("div");
  // session time
  myCountTime.setAttribute("id", "countTime");
  // my peer name
  myPeerName.setAttribute("id", "myVideoParagraph");
  myPeerName.className = "videoPeerName fadein";
  // my hand status element
  myHandStatusIcon.setAttribute("id", "myHandStatusIcon");
  myHandStatusIcon.className = className.handPulsate;
  myHandStatusIcon.style.setProperty("color", "rgb(0, 255, 0)");
  // my privacy button
  myPrivacyBtn.setAttribute("id", "myPrivacyBtn");
  myPrivacyBtn.className = className.privacy;
  // my video status element
  myVideoStatusIcon.setAttribute("id", "myVideoStatusIcon");
  myVideoStatusIcon.className = className.videoOn;
  // my audio status element
  myAudioStatusIcon.setAttribute("id", "myAudioStatusIcon");
  myAudioStatusIcon.className = className.audioOn;
  // my video to image
  myVideoToImgBtn.setAttribute("id", "myVideoToImgBtn");
  myVideoToImgBtn.className = className.snapShot;
  // my video To'liq ekran
  myVideoFullScreenBtn.setAttribute("id", "myVideoFullScreenBtn");
  myVideoFullScreenBtn.className = className.fullScreen;
  // my video pin/unpin button
  if (buttons.main.showmyPinButton) {
    myVideoPinBtn.setAttribute("id", "myVideoPinBtn");
    myVideoPinBtn.className = className.pinUnpin;
  }
  // console log all values of audioutput devices select
  console.log("Audio Output Devices");
  console.log(getId("audioSource").options);
  // if there is "🎤 AirPods" select it
  for (let output of getId("audioSource").options) {
    if (output.text === "🎤 AirPods" || output.text === "🎤 AirPods Pro") {
      getId("audioSource").value =
        localStorage.getItem("audioInputSelect") || output.value;
    }
  }
  // no mobile devices
  setTippy(myHandStatusIcon, "My hand is raised", "bottom");
  setTippy(myPrivacyBtn, "Toggle video privacy", "bottom");
  setTippy(myAudioStatusIcon, "Ovoz yoniq", "bottom");
  setTippy(myVideoToImgBtn, "Skrenshot olish", "bottom");
  setTippy(myVideoFullScreenBtn, "To'liq ekran", "bottom");
  setTippy(myVideoPinBtn, "Pin qilish", "bottom");

  // my video avatar image
  myVideoAvatarImage.setAttribute("id", "myVideoAvatarImage");
  myVideoAvatarImage.className = "videoAvatarImage pulsate";

  // my pitch meter
  myPitchMeter.setAttribute("id", "myPitch");
  myPitchBar.setAttribute("id", "myPitchBar");
  myPitchMeter.className = "speechbar";
  myPitchBar.className = "bar";
  myPitchBar.style.height = "1%";

  // my video nav bar
  myVideoNavBar.className = "navbar";

  // attach to video nav bar
  myVideoNavBar.appendChild(myCountTime);

  if (!isMobileDevice && buttons.chat.showPinUnpin) {
    myVideoNavBar.appendChild(myVideoPinBtn);
  }
  if (isVideoFullScreenSupported && buttons.main.showFullScreenBtn) {
    myVideoNavBar.appendChild(myVideoFullScreenBtn);
  }
  if (buttons.local.showSnapShotBtn) {
    myVideoNavBar.appendChild(myVideoToImgBtn);
  }
  if (buttons.local.showVideoCircleBtn) {
    myVideoNavBar.appendChild(myPrivacyBtn);
  }
  if (buttons.main.showmyVideoStatusButton) {
    myVideoNavBar.appendChild(myVideoStatusIcon);
  }
  myVideoNavBar.appendChild(myAudioStatusIcon);
  myVideoNavBar.appendChild(myHandStatusIcon);

  // add my pitchBar
  myPitchMeter.appendChild(myPitchBar);

  // hand display none on default menad is raised == false
  myHandStatusIcon.style.display = "none";

  myLocalMedia.setAttribute("id", "myVideo");
  myLocalMedia.setAttribute("playsinline", true);
  myLocalMedia.className = "mirror";
  myLocalMedia.autoplay = true;
  myLocalMedia.muted = true;
  myLocalMedia.volume = 0;
  myLocalMedia.controls = false;
  myVideoWrap.className = "Camera";
  myVideoWrap.setAttribute("id", "myVideoWrap");
  // add elements to video wrap div
  myVideoWrap.appendChild(myVideoNavBar);
  myVideoWrap.appendChild(myVideoAvatarImage);
  myVideoWrap.appendChild(myLocalMedia);
  myVideoWrap.appendChild(myPitchMeter);
  myVideoWrap.appendChild(myPeerName);
  getId("videoMediaContainer").appendChild(myVideoWrap);
  myVideoWrap.style.display = "none";
  logStreamSettingsInfo("localMediaStream", localMediaStream);
  attachMediaStream(myLocalMedia, localMediaStream);
  adaptAspectRatio();
  getHtmlElementsById();
  setButtonsToolTip();
  manageLeftButtons();
  handleButtonsRule();
  setupMySettings();
  startCountTime();
  handleBodyOnMouseMove();
  if (isVideoFullScreenSupported && buttons.main.showFullScreenBtn) {
    handleVideoPlayerFs(myLocalMedia.id, myVideoFullScreenBtn.id);
  }
  if (buttons.local.showSnapShotBtn) {
    handleVideoToImg(myLocalMedia.id, myVideoToImgBtn.id);
  }
  if (buttons.local.showVideoCircleBtn) {
    handleVideoPrivacyBtn(myLocalMedia.id, myPrivacyBtn.id);
  }
  handleVideoPinUnpin(
    myLocalMedia.id,
    myVideoPinBtn.id,
    myVideoWrap.id,
    myLocalMedia.id
  );
  refreshMyVideoAudioStatus(localMediaStream);
  if (!useVideo) {
    myVideoAvatarImage.style.display = "block";
    myVideoStatusIcon.className = className.videoOff;
    videoBtn.className = className.videoOff;
  }
  updateMyName();
}

/**
 * Load Remote Media Stream obj
 * @param {object} stream media stream audio - video
 * @param {object} peers all peers info connected to the same room
 * @param {string} peer_id socket.id
 */
async function loadRemoteMediaStream(
  stream,
  peers,
  peer_id,
  typeStream = "stream"
) {
  // get data from peers obj
  let peer_name = peers[peer_id]["peer_name"];
  let peer_video = peers[peer_id]["peer_video"];
  let peer_video_status = peers[peer_id]["peer_video_status"];
  let peer_audio_status = peers[peer_id]["peer_audio_status"];
  let peer_screen_status = peers[peer_id]["peer_screen_status"];
  let peer_hand_status = peers[peer_id]["peer_hand_status"];
  let peer_rec_status = peers[peer_id]["peer_rec_status"];
  let peer_privacy_status = peers[peer_id]["peer_privacy_status"];
  remoteMediaStream = stream;
  // remote video elements
  const remoteVideoWrap = document.createElement("div");
  const remoteMedia = document.createElement("video");
  // html elements
  const remoteVideoNavBar = document.createElement("div");
  const remotePeerName = document.createElement("div");
  const remoteHandStatusIcon = document.createElement("button");
  const remoteVideoStatusIcon = document.createElement("button");
  const remoteAudioStatusIcon = document.createElement("button");
  const remoteVideoAudioUrlBtn = document.createElement("button");
  const remoteFileShareBtn = document.createElement("button");
  const remotePrivateMsgBtn = document.createElement("button");
  const remoteVideoToImgBtn = document.createElement("button");
  const remoteVideoFullScreenBtn = document.createElement("button");
  const remoteVideoPinBtn = document.createElement("button");
  const remoteVideoAvatarImage = document.createElement("img");
  const remotePitchMeter = document.createElement("div");
  const remotePitchBar = document.createElement("div");
  const remoteAudioVolume = document.createElement("input");
  // remote peer name element
  remotePeerName.setAttribute("id", peer_id + "_name");
  remotePeerName.className = "videoPeerName";
  const peerVideoText = document.createTextNode(peer_name);
  remotePeerName.appendChild(peerVideoText);
  // remote video status element
  remoteVideoStatusIcon.setAttribute("id", peer_id + "_videoStatus");
  remoteVideoStatusIcon.className = className.videoOn;
  // remote audio status element
  remoteAudioStatusIcon.setAttribute("id", peer_id + "_audioStatus");
  remoteAudioStatusIcon.className = className.audioOn;
  // remote audio volume element
  remoteAudioVolume.setAttribute("id", peer_id + "_audioVolume");
  remoteAudioVolume.type = "range";
  remoteAudioVolume.min = 0;
  remoteAudioVolume.max = 100;
  remoteAudioVolume.value = 100;
  // remote private message
  remotePrivateMsgBtn.setAttribute("id", peer_id + "_privateMsg");
  remotePrivateMsgBtn.className = className.msgPrivate;
  // remote share file
  remoteFileShareBtn.setAttribute("id", peer_id + "_shareFile");
  remoteFileShareBtn.className = className.shareFile;
  // remote peer YouTube video
  remoteVideoAudioUrlBtn.setAttribute("id", peer_id + "_videoAudioUrl");
  remoteVideoAudioUrlBtn.className = className.shareVideoAudio;
  // my video to image
  remoteVideoToImgBtn.setAttribute("id", peer_id + "_snapshot");
  remoteVideoToImgBtn.className = className.snapShot;
  // remote video To'liq ekran
  remoteVideoFullScreenBtn.setAttribute("id", peer_id + "_fullScreen");
  remoteVideoFullScreenBtn.className = className.fullScreen;
  // remote video pin/unpin button
  remoteVideoPinBtn.setAttribute("id", peer_id + "_pinUnpin");
  remoteVideoPinBtn.className = className.pinUnpin;
  // no mobile devices
  setTippy(remoteHandStatusIcon, "Participant hand is raised", "bottom");
  //setTippy(remoteVideoStatusIcon, "Participant video is on", "bottom");
  setTippy(remoteAudioStatusIcon, "Participant is unmuted", "bottom");
  setTippy(remoteAudioVolume, "🔊 Ovoz", "top-end");
  setTippy(remoteVideoAudioUrlBtn, "Video/Audio yuborish", "bottom");
  setTippy(remotePrivateMsgBtn, "Send DM", "bottom");
  setTippy(remoteFileShareBtn, "Send file", "bottom");
  setTippy(remoteVideoToImgBtn, "Skrenshot olish", "bottom");
  setTippy(remoteVideoFullScreenBtn, "To'liq ekran", "bottom");
  setTippy(remoteVideoPinBtn, "Videoni pin qilish", "bottom");
  // my video avatar image
  remoteVideoAvatarImage.setAttribute("id", peer_id + "_avatar");
  remoteVideoAvatarImage.className = "videoAvatarImage pulsate";
  // remote pitch meter
  remotePitchMeter.setAttribute("id", peer_id + "_pitch");
  remotePitchBar.setAttribute("id", peer_id + "_pitch_bar");
  remotePitchMeter.className = "speechbar";
  remotePitchBar.className = "bar";
  remotePitchBar.style.height = "1%";
  remotePitchMeter.appendChild(remotePitchBar);
  // remote video nav bar
  remoteVideoNavBar.className = "navbar";
  // attach to remote video nav bar
  if (!isMobileDevice && buttons.chat.showPinUnpin) {
    remoteVideoNavBar.appendChild(remoteVideoPinBtn);
  }
  if (isVideoFullScreenSupported && buttons.remote.remoteFullScreenStatus_) {
    remoteVideoNavBar.appendChild(remoteVideoFullScreenBtn);
  }
  if (buttons.remote.showSnapShotBtn) {
    remoteVideoNavBar.appendChild(remoteVideoToImgBtn);
  }
  if (buttons.remote.showmyVideoStatusButton) {
    remoteVideoNavBar.appendChild(remoteVideoStatusIcon);
  }
  remoteVideoNavBar.appendChild(remoteAudioStatusIcon);

  if (buttons.remote.showAudioVolume) {
    remoteVideoNavBar.appendChild(remoteAudioVolume);
  }
  remoteVideoNavBar.appendChild(remoteHandStatusIcon);
  if (buttons.remote.showPrivateMessageBtn) {
    remoteVideoNavBar.appendChild(remotePrivateMsgBtn);
  }
  if (buttons.remote.showShareVideoAudioBtn) {
    remoteVideoNavBar.appendChild(remoteVideoAudioUrlBtn);
  }
  // undisplay navbar
  remoteVideoNavBar.style.display = "none";
  remoteMedia.setAttribute("id", peer_id + "_video");
  remoteMedia.setAttribute("playsinline", true);
  remoteMedia.autoplay = true;
  isMobileDevice
    ? (remoteMediaControls = false)
    : (remoteMediaControls = remoteMediaControls);
  remoteMedia.style.objectFit = peer_screen_status
    ? "contain"
    : "var(--video-object-fit)";
  remoteMedia.style.name =
    peer_id + (peer_screen_status ? "_typeScreen" : "_typeCam");
  remoteMedia.controls = remoteMediaControls;
  remoteVideoWrap.className = "Camera";
  remoteVideoWrap.setAttribute("id", peer_id + "_videoWrap");
  // add elements to videoWrap div
  remoteVideoWrap.appendChild(remoteVideoNavBar);
  remoteVideoWrap.appendChild(remoteVideoAvatarImage);
  remoteVideoWrap.appendChild(remotePitchMeter);
  remoteVideoWrap.appendChild(remoteMedia);
  remoteVideoWrap.appendChild(remotePeerName);
  // need later on disconnect or remove peers
  peerMediaElements[peer_id] = remoteVideoWrap;
  // append all elements to videoMediaContainer
  getId("videoMediaContainer").appendChild(remoteVideoWrap);
  // attachMediaStream is a part of the adapter.js library
  if (typeStream == "stream") {
    attachMediaStream(remoteMedia, remoteMediaStream);
  } else {
    remoteMedia.src = stream;
    remoteMedia.play();
  }
  console.log("remoteMediaStreamm", remoteMediaStream);
  // resize video elements
  adaptAspectRatio();

  if (buttons.remote.showSnapShotBtn) {
    // handle video to image
    handleVideoToImg(remoteMedia.id, remoteVideoToImgBtn.id, peer_id);
  }
  // handle video pin/unpin
  handleVideoPinUnpin(
    remoteMedia.id,
    remoteVideoPinBtn.id,
    remoteVideoWrap.id,
    peer_id,
    peer_screen_status
  );
  // pin video on screen share detected
  if (peer_video_status && peer_screen_status) {
    getId(remoteVideoPinBtn.id).click();
  }
  if (isVideoFullScreenSupported) {
    handleVideoPlayerFs(remoteMedia.id, remoteVideoFullScreenBtn.id, peer_id);
  }
  if (peer_privacy_status) {
    // set video privacy true
    setVideoPrivacyStatus(remoteMedia.id, peer_privacy_status);
  }
  // refresh remote peers avatar name
  setPeerAvatarImgName(remoteVideoAvatarImage.id, peer_name, useAvatarApi);
  // refresh remote peers video icon status and title
  setPeerVideoStatus(peer_id, peer_video_status);
  // refresh remote peers audio icon status and title
  setPeerAudioStatus(peer_id, peer_audio_status);
  // handle remote peers audio volume
  handleAudioVolume(remoteAudioVolume.id, remoteMedia.id);
  // handle remote peers audio on-off
  handlePeerAudioBtn(peer_id);
  // handle remote peers video on-off
  handlePeerVideoBtn(peer_id);
  if (buttons.remote.showPrivateMessageBtn) {
    // handle remote private messages
    handlePeerPrivateMsg(peer_id, peer_name);
  }
  // show status menu
  toggleClassElements("statusMenu", "inline");
  // peer not has video at all
  if (buttons.remote.showmyVideoStatusButton && !peer_video) {
    remoteVideoAvatarImage.style.display = "block";
    remoteVideoStatusIcon.className = className.videoOff;
  }
}
/**
 * Log stream settings info
 * @param {string} name function name called from
 * @param {object} stream media stream audio - video
 */
function logStreamSettingsInfo(name, stream) {
  if (useVideo || isScreenStreaming) {
    console.log(name, {
      video: {
        label: stream.getVideoTracks()[0].label,
        settings: stream.getVideoTracks()[0].getSettings(),
      },
    });
  }
  if (useAudio) {
    console.log(name, {
      audio: {
        label: stream.getAudioTracks()[0].label,
        settings: stream.getAudioTracks()[0].getSettings(),
      },
    });
  }
}

/**
 * Handle aspect ratio
 * ['0:0', '4:3', '16:9', '1:1', '1:2'];
 *    0      1       2      3      4
 */
function adaptAspectRatio() {
  let participantsCount = getId("videoMediaContainer").childElementCount;
  let desktop,
    mobile = 1;
  // desktop aspect ratio
  switch (participantsCount) {
    // case 1:
    //     desktop = 0; // (0:0)
    //     break;
    case 1:
    case 3:
    case 4:
    case 7:
    case 9:
      desktop = 2; // (16:9)
      break;
    case 5:
    case 6:
    case 10:
    case 11:
      desktop = 1; // (4:3)
      break;
    case 2:
    case 8:
      desktop = 3; // (1:1)
      break;
    default:
      desktop = 0; // (0:0)
  }
  // mobile aspect ratio
  switch (participantsCount) {
    case 3:
    case 9:
    case 10:
      mobile = 2; // (16:9)
      break;
    case 2:
    case 7:
    case 8:
    case 11:
      mobile = 1; // (4:3)
      break;
    case 1:
    case 4:
    case 5:
    case 6:
      mobile = 3; // (1:1)
      break;
    default:
      mobile = 3; // (1:1)
  }
  if (participantsCount > 11) {
    desktop = 1; // (4:3)
    mobile = 3; // (1:1)
  }
  setAspectRatio(isMobileDevice ? mobile : desktop);
}

/**
 * Refresh video - chat image avatar on name changes: https://eu.ui-avatars.com/
 * @param {string} videoAvatarImageId element id
 * @param {string} peerName
 * @param {boolean} useAvatar use avatar api for image
 */
function setPeerAvatarImgName(videoAvatarImageId, peerName, useAvatar) {
  let videoAvatarImageElement = getId(videoAvatarImageId);
  if (useAvatar) {
    // default img size 64 max 512
    let avatarImgSize = isMobileDevice ? 128 : 256;
    videoAvatarImageElement.setAttribute(
      "src",
      avatarApiUrl +
      "?name=" +
      (peerName || localStorage.getItem("peerName")) +
      "&size=" +
      avatarImgSize +
      "&background=random&rounded=true"
    );
  } else {
    videoAvatarImageElement.setAttribute("src", avatarImg);
  }
}

/**
 * Set Chat avatar image by peer name
 * @param {string} avatar position left/right
 * @param {string} peerName me or peer name
 */
function setPeerChatAvatarImgName(avatar, peerName) {
  let avatarImg =
    avatarApiUrl +
    "?name=" +
    (peerName || localStorage.getItem("peerName")) +
    "&size=32" +
    "&background=random&rounded=true";

  switch (avatar) {
    case "left":
      // console.log("Set Friend chat avatar image");
      leftChatAvatar = avatarImg;
      break;
    case "right":
      // console.log("Set My chat avatar image");
      rightChatAvatar = avatarImg;
      break;
  }
}

/**
 * On video player click, go on To'liq ekran ||
 * On button click, go on To'liq ekran.
 * Press Esc to exit from To'liq ekran, or click again.
 * @param {string} videoId uuid video element
 * @param {string} videoFullScreenBtnId uuid full screen btn
 * @param {string} peer_id socket.id
 */
function handleVideoPlayerFs(videoId, videoFullScreenBtnId, peer_id = null) {
  let videoPlayer = getId(videoId);

  // handle Chrome Firefox Opera Microsoft Edge videoPlayer ESC
  videoPlayer.addEventListener("fullscreenchange", (e) => {
    // if Controls enabled, or document on FS do nothing
    if (videoPlayer.controls || isDocumentOnFullScreen) return;
    let fullscreenElement = document.fullscreenElement;
    if (!fullscreenElement) {
      videoPlayer.style.pointerEvents = "auto";
      isVideoOnFullScreen = false;
    }
  });

  // handle Safari videoPlayer ESC
  videoPlayer.addEventListener("webkitfullscreenchange", (e) => {
    // if Controls enabled, or document on FS do nothing
    if (videoPlayer.controls || isDocumentOnFullScreen) return;
    let webkitIsFullScreen = document.webkitIsFullScreen;
    if (!webkitIsFullScreen) {
      videoPlayer.style.pointerEvents = "auto";
      isVideoOnFullScreen = false;
    }
  });

  // on video click go on FS
  videoPlayer.addEventListener("click", (e) => {
    if (videoPlayer.classList.contains("videoCircle")) {
      return userLog(
        "toast",
        "Full Screen isn't allowed until privacy mode is ON"
      );
    }
    // not mobile on click go on FS or exit from FS
    if (!isMobileDevice) {
      gotoFS();
    } else {
      // mobile on click exit from FS, for enter use videoFullScreenBtn
      if (isVideoOnFullScreen) handleFSVideo();
    }
  });

  function gotoFS() {
    // handle remote peer video fs
    if (peer_id !== null) {
      let remoteVideoStatusBtn = getId(peer_id + "_videoStatus");
      if (remoteVideoStatusBtn.className === className.videoOn) {
        handleFSVideo();
      } else {
        showMsg();
      }
    } else {
      if (
        myVideoStatusIcon.className === className.videoOn ||
        isScreenStreaming
      ) {
        handleFSVideo();
      } else {
        showMsg();
      }
    }
  }

  function showMsg() {
    userLog("toast", "To'liq ekran works when video is on");
  }

  function handleFSVideo() {
    // if Controls enabled, or document on FS do nothing
    if (videoPlayer.controls || isDocumentOnFullScreen) return;

    if (!isVideoOnFullScreen) {
      if (videoPlayer.requestFullscreen) {
        // Chrome Firefox Opera Microsoft Edge
        videoPlayer.requestFullscreen();
      } else if (videoPlayer.webkitRequestFullscreen) {
        // Safari request To'liq ekran
        videoPlayer.webkitRequestFullscreen();
      } else if (videoPlayer.msRequestFullscreen) {
        // IE11 request To'liq ekran
        videoPlayer.msRequestFullscreen();
      }
      isVideoOnFullScreen = true;
      videoPlayer.style.pointerEvents = "none";
      // console.log("Go on FS isVideoOnFullScreen", isVideoOnFullScreen);
    } else {
      if (document.exitFullscreen) {
        // Chrome Firefox Opera Microsoft Edge
        document.exitFullscreen();
      } else if (document.webkitCancelFullScreen) {
        // Safari exit To'liq ekran ( Not work... )
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        // IE11 exit To'liq ekran
        document.msExitFullscreen();
      }
      isVideoOnFullScreen = false;
      videoPlayer.style.pointerEvents = "auto";
    }
  }
}
/**
 * Handle video privacy button click event
 * @param {string} videoId
 * @param {boolean} privacyBtnId
 */
function handleVideoPrivacyBtn(videoId, privacyBtnId) {
  let video = getId(videoId);
  let privacyBtn = getId(privacyBtnId);
  if (useVideo && video && privacyBtn) {
    privacyBtn.addEventListener("click", () => {
      // playSound("click");
      isVideoPrivacyActive = !isVideoPrivacyActive;
      setVideoPrivacyStatus(videoId, isVideoPrivacyActive);
      emitPeerStatus("privacy", isVideoPrivacyActive);
    });
  } else {
    if (privacyBtn) privacyBtn.style.display = "none";
  }
}

/**
 * Set video privacy status
 * @param {string} peerVideoId
 * @param {boolean} peerPrivacyActive
 */
function setVideoPrivacyStatus(peerVideoId, peerPrivacyActive) {
  let video = getId(peerVideoId);
  if (peerPrivacyActive) {
    video.classList.remove("videoDefault");
    video.classList.add("videoCircle");
    video.style.objectFit = "cover";
  } else {
    video.classList.remove("videoCircle");
    video.classList.add("videoDefault");
    video.style.objectFit = "var(--video-object-fit)";
  }
}

/**
 * Handle video pin/unpin
 * @param {string} elemId video id
 * @param {string} pnId button pin id
 * @param {string} camId video wrap id
 * @param {string} peerId peer id
 * @param {boolean} isScreen stream
 */
function handleVideoPinUnpin(elemId, pnId, camId, peerId, isScreen = false) {
  let videoPlayer = getId(elemId);
  let btnPn = getId(pnId);
  let cam = getId(camId);
  let videoMediaContainer = getId("videoMediaContainer");
  let videoPinMediaContainer = getId("videoPinMediaContainer");
  if (btnPn && videoPlayer && cam) {
    btnPn.addEventListener("click", () => {
      playSound("click");
      isVideoPinned = !isVideoPinned;
      if (isVideoPinned) {
        if (!videoPlayer.classList.contains("videoCircle")) {
          videoPlayer.style.objectFit = "contain";
        }
        cam.className = "";
        cam.style.width = "100%";
        cam.style.height = "100%";
        toggleVideoPin(pinVideoPositionSelect.value);
        videoPinMediaContainer.appendChild(cam);
        videoPinMediaContainer.style.display = "block";
        pinnedVideoPlayerId = elemId;
        setColor(btnPn, "lime");
      } else {
        if (pinnedVideoPlayerId != videoPlayer.id) {
          isVideoPinned = true;
          return userLog(
            "toast",
            "Another video seems pinned, unpin it before to pin this one",
            5000
          );
        }
        if (!isScreenStreaming)
          videoPlayer.style.objectFit = "var(--video-object-fit)";
        if (isScreen || videoPlayer.style.name == peerId + "_typeScreen")
          videoPlayer.style.objectFit = "contain";
        videoPinMediaContainer.removeChild(cam);
        cam.className = "Camera";
        videoMediaContainer.appendChild(cam);
        removeVideoPinMediaContainer(peerId, true);
        setColor(btnPn, "white");
      }
      adaptAspectRatio();
    });
  }
}

function toggleVideoPin(position) {
  if (!isVideoPinned) return;
  const videoMediaContainer = getId("videoMediaContainer");
  const videoPinMediaContainer = getId("videoPinMediaContainer");
  switch (position) {
    case "top":
      videoPinMediaContainer.style.top = "25%";
      videoPinMediaContainer.style.width = "100%";
      videoPinMediaContainer.style.height = "70%";
      videoMediaContainer.style.top = 0;
      videoMediaContainer.style.width = "100%";
      videoMediaContainer.style.height = "25%";
      videoMediaContainer.style.right = 0;
      break;
    case "vertical":
      videoPinMediaContainer.style.top = 0;
      videoPinMediaContainer.style.height = "100%";
      videoMediaContainer.style.top = 0;
      videoMediaContainer.style.width = "25%";
      videoMediaContainer.style.height = "100%";
      videoMediaContainer.style.right = 0;
      break;
    case "horizontal":
      videoPinMediaContainer.style.top = 0;
      videoPinMediaContainer.style.width = "100%";
      videoPinMediaContainer.style.height = "75%";
      videoMediaContainer.style.top = "75%";
      videoMediaContainer.style.right = null;
      videoMediaContainer.style.width = null;
      videoMediaContainer.style.width = "100% !important";
      videoMediaContainer.style.height = "25%";
      break;
  }
  resizeVideoMedia();
}

/**
 * Remove video pin media container
 * @param {string} peer_id aka socket.id
 * @param {boolean} force_remove force to remove
 */
function removeVideoPinMediaContainer(peer_id, force_remove = false) {
  if (
    (isVideoPinned &&
      (pinnedVideoPlayerId == peer_id + "_video" ||
        pinnedVideoPlayerId == peer_id)) ||
    force_remove
  ) {
    const videoPinMediaContainer = getId("videoPinMediaContainer");
    const videoMediaContainer = getId("videoMediaContainer");
    videoPinMediaContainer.style.display = "none";
    videoMediaContainer.style.top = 0;
    videoMediaContainer.style.right = null;
    videoMediaContainer.style.width = "100%";
    videoMediaContainer.style.height = "100%";
    pinnedVideoPlayerId = null;
    isVideoPinned = false;
    resizeVideoMedia();
  }
}

/**
 * Handle Video to Img click event
 * @param {string} videoStream uuid video element
 * @param {string} videoToImgBtn uuid snapshot btn
 * @param {string} peer_id socket.id
 */
function handleVideoToImg(videoStream, videoToImgBtn, peer_id = null) {
  let videoBtn = getId(videoToImgBtn);
  let video = getId(videoStream);
  videoBtn.addEventListener("click", () => {
    if (video.classList.contains("videoCircle")) {
      return userLog(
        "toast",
        "Snapshot isn't allowed until privacy mode is ON"
      );
    }
    if (peer_id !== null) {
      // handle remote video snapshot
      let remoteVideoStatusBtn = getId(peer_id + "_videoStatus");
      // if (remoteVideoStatusBtn.className === className.videoOn) {
      return takeSnapshot(video);
      //}
    } else {
      // handle local video snapshot
      if (
        buttons.remote.showmyVideoStatusButton &&
        myVideoStatusIcon.className === className.videoOn
      ) {
        return takeSnapshot(video);
      }
    }
    userLog("toast", "Skrenshot video o'chiqligida ishlamaydi");
  });
}

/**
 * Save Video Frame to Image
 * @param {object} video element from where to take the snapshot
 */
function takeSnapshot(video) {
  playSound("snapshot");
  let context, canvas, width, height, dataURL;
  width = video.videoWidth;
  height = video.videoHeight;
  canvas = canvas || document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, width, height);
  dataURL = canvas.toDataURL("image/png"); // or image/jpeg
  // console.log(dataURL);
  saveDataToFile(dataURL, getDataTimeString() + "-SNAPSHOT.png");
}

/**
 * Start talk time
 */
function startCountTime() {
  countTime.style.display = "inline";
  callStartTime = Date.now();
  setInterval(function printTime() {
    callElapsedTime = Date.now() - callStartTime;
    countTime.innerHTML = getTimeToString(callElapsedTime);
  }, 1000);
}

/**
 * Convert time to string
 * @param {integer} time
 * @return {string} format HH:MM:SS
 */
function getTimeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);
  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);
  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);
  let formattedHH = hh.toString().padStart(2, "0");
  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

/**
 * Refresh my localMediaStream audio/video status
 * @param object} localMediaStream
 */
function refreshMyVideoAudioStatus(localMediaStream) {
  // check Track audio/video status
  localMediaStream.getTracks().forEach((track) => {
    switch (track.kind) {
      case "video":
        myVideoStatus = track.enabled;
        break;
      case "audio":
        myAudioStatus = track.enabled;
        break;
    }
  });
}

/**
 * Handle WebRTC left buttons
 */
function manageLeftButtons() {
  setAudioOutputBtn();
  setShareRoomBtn();
  setAudioBtn();
  setVideoBtn();
  setSwapCameraBtn();
  setFullScreenBtn();
  setChatEmojiBtn();
  // setMySettingsBtn();
  setAboutBtn();
  setLeaveRoomBtn();
  setNextBtn();
}

/**
 * Copy - share room url button click event
 */
function setShareRoomBtn() {
  shareRoomBtn.addEventListener("click", async (e) => {
    shareRoomUrl();
  });
}

function refreshLocalMedia_only_audio() {
  stopLocalAudioTrack();
  navigator.mediaDevices
    .getUserMedia({ audio: true }) // Запрашиваем только аудио
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
}

audioOutputBtn = getId("audioOutputChangeBtn");

// Update font awesome icon based on device name
function updateVolumeIcon(deviceType) {
  if (deviceType == audioDevices.speakerphone) {
    audioOutputBtn.className = "fa-solid fa-volume-high";
  }
  else if (deviceType == audioDevices.bluetooth) {
    audioOutputBtn.className = "fa-brands fa-bluetooth";
  }
  else if (deviceType == audioDevices.wired) {
    audioOutputBtn.className = "fa-solid fa-headphones"
  }
  else if (deviceType == audioDevices.earpiece) {
    audioOutputBtn.className = 'fa-solid fa-phone';
  } else {
    audioOutputBtn.className = 'fa-solid fa-volume-low';
  }

}

async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.length > 0 ? devices : false;
}

function identifyDevice(device) {
  if (device.match(/earpiece/ig)) {
    return audioDevices.earpiece;
  }
  if (device.match(/speakerphone/ig)) {
    return audioDevices.speakerphone;
  }
  if (device.match(/wired/ig)) {
    return audioDevices.wired;
  }
  if (device.match(/bluetooth/ig)) {
    return audioDevices.bluetooth;
  }
  return audioDevices.default;
}

const audioSourceHtml = `
<div id="audioDeviceOptions">
    <label for="audioSource"></label>
    <div class="device-buttons">
    </div>
</div>
`;
const container = document.createElement('div');
container.innerHTML = audioSourceHtml;
container.style.display = 'none';
document.body.appendChild(container);

function showAudioDevices(isOpen) {
  if (!isMySettingsVisible) {
    isMySettingsVisible = true;
  }
  if (isOpen == "true") {
    isOpen = "false";
  } else {
    isOpen = "true";
  }
  localStorage.setItem("speakerOptionBtn", isOpen);
  if (isOpen == "false") {
    hideShowMySettings();
  }
  isMySettingsVisible = false;
  container.style.display = isOpen == "true" ? "none" : 'flex';
  getId("audioDeviceOptions").style.display = isOpen == "true" ? "none" : "flex";
}

/**
 * audio output device change
 */

function setAudioOutputBtn() {
  audioOutputChangeBtn.addEventListener("click", async (e) => {
    let isOpen = localStorage.getItem("speakerOptionBtn") || "true";
    showAudioDevices(isOpen);
    handleAudioDeviceBtn();
  });
  audioOutputChangeBtn.style.display = "none";
}



/**
 * Audio mute - unmute button click event
 */
function setAudioBtn() {
  audioBtn.addEventListener("click", (e) => {
    handleAudio(e, false);
  });
}

/**
 * Video hide - show button click event
 */
function setVideoBtn() {
  videoBtn.addEventListener("click", (e) => {
    handleVideo(e, false);
  });
}

/**
 * Check if can swap or not the cam, if yes show the button else hide it
 */
function setSwapCameraBtn() {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const videoInput = devices.filter((device) => device.kind === "videoinput");
    if (videoInput.length > 1 && isMobileDevice) {
      swapCameraBtn.addEventListener("click", (e) => {
        swapCamera();
      });
    } else {
      swapCameraBtn.style.display = "none";
    }
  });
}

/**
 * Full screen button click event
 */
function setFullScreenBtn() {
  if (myBrowserName != "Safari") {
    // detect esc from To'liq ekran
    document.addEventListener("fullscreenchange", (e) => {
      let fullscreenElement = document.fullscreenElement;
      if (!fullscreenElement) {
        fullScreenBtn.className = className.fsOff;
        isDocumentOnFullScreen = false;
        setTippy(fullScreenBtn, "To'liq ekran", "right-start");
      }
    });
    fullScreenBtn.addEventListener("click", (e) => {
      toggleFullScreen();
    });
  } else {
    fullScreenBtn.style.display = "none";
  }
}

/**
 * Chat room buttons click event
 */
function setChatRoomBtn() {

  chatRoomBtn.style.display = "none";
  // adapt chat room size for mobile
  setChatRoomAndCaptionForMobile();

  // open hide chat room
  // chatRoomBtn.addEventListener("click", (e) => {
  //   if (!isChatRoomVisible) {
  //     showChatRoomDraggable();
  //   } else {
  //     hideChatRoomAndEmojiPicker();
  //     e.target.className = className.chatOn;
  //   }
  // });

  // show msger participants section
  msgerCPBtn.addEventListener("click", (e) => {
    if (!thereIsPeerConnections()) {
      return userLog("info", "No participants detected");
    }
    msgerCP.style.display = "flex";
  });

  // hide msger participants section
  msgerCPCloseBtn.addEventListener("click", (e) => {
    msgerCP.style.display = "none";
  });

  // clean chat messages
  msgerClean.addEventListener("click", (e) => {
    if (chatMessages.length != 0) {
      return cleanMessages();
    }
    userLog("info", "Xabar yo'q");
  });

  // save chat messages to file
  msgerSaveBtn.addEventListener("click", (e) => {
    if (chatMessages.length != 0) {
      return downloadChatMsgs();
    }
    userLog("info", "No chat messages to save");
  });

  // close chat room - show left button and status menu if hide
  msgerClose.addEventListener("click", (e) => {
    hideChatRoomAndEmojiPicker();
    showButtonsBarAndMenu();
  });

  // Execute a function when the user releases a key on the keyboard
  msgerInput.addEventListener("keyup", (e) => {
    // Number 13 is the "Enter" key on the keyboard
    if (e.keyCode === 13 && (isMobileDevice || !e.shiftKey)) {
      e.preventDefault();
      msgerSendBtn.click();
    }
  });

  // on input check 4emoji from map
  msgerInput.oninput = function () {
    for (let i in chatInputEmoji) {
      let regex = new RegExp(escapeSpecialChars(i), "gim");
      this.value = this.value.replace(regex, chatInputEmoji[i]);
    }
    checkLineBreaks();
  };

  msgerInput.onpaste = () => {
    isChatPasteTxt = true;
    checkLineBreaks();
  };

  // paste to input msg txt
  msgerPasteBtn.addEventListener("click", (e) => {
    pasteToMessageInput();
  });

  // chat show on message
  msgerShowChatOnMsg.addEventListener("change", (e) => {
    // playSound("click");
    showChatOnMessage = e.currentTarget.checked;
    if (showChatOnMessage) {
      msgPopup(
        "info",
        "Chat will be shown, when you'll receive a new message",
        "top-end",
        3000
      );
    } else {
      msgPopup(
        "info",
        "Chat won't will be shown, when you'll receive a new message",
        "top-end",
        3000
      );
    }
  });

  // chat send msg
  msgerSendBtn.addEventListener("click", (e) => {
    // prevent refresh page
    e.preventDefault();
    sendChatMessage();
  });

  // adapt input font size 4 mobile
  if (isMobileDevice) msgerInput.style.fontSize = "xx-small";
}

/**
 * Emoji picker chat room button click event
 */
function setChatEmojiBtn() {
  msgerEmojiBtn.addEventListener("click", (e) => {
    // prevent refresh page
    e.preventDefault();
    hideShowEmojiPicker();
  });
  // Add emoji picker
  const pickerOptions = { onEmojiSelect: addEmojiToMsg };
  const emojiPicker = new EmojiMart.Picker(pickerOptions);
  msgerEmojiPicker.appendChild(emojiPicker);
}

/**
 * Add emoji to chat message
 */
function addEmojiToMsg(data) {
  //console.log(data);
  msgerInput.value += data.native;
  hideShowEmojiPicker();
}


/**
 * My settings button click event
 */
function setMySettingsBtn() {
  mySettingsBtn.addEventListener("click", (e) => {
    // if (isMobileDevice) {
    //   buttonsBar.style.display = "none";
    //   isButtonsVisible = false;
    // }
    hideShowMySettings();
  });
  mySettingsCloseBtn.addEventListener("click", (e) => {
    hideShowMySettings();
  });
  myPeerNameSetBtn.addEventListener("click", (e) => {
    updateMyPeerName();
  });
  // Sounds
  // switchSounds.addEventListener("change", (e) => {
  //   notifyBySound = e.currentTarget.checked;
  // });

  // make chat room draggable for desktop
  if (!isMobileDevice) dragElement(mySettings, mySettingsHeader);
  // mySettingsBtn.style.display = "none";
}

/**
 * About button click event
 */
function setAboutBtn() {
  aboutBtn.addEventListener("click", (e) => {
    showAbout();
  });
}

/**
 * Leave room button click event
 */
function setLeaveRoomBtn() {
  leaveRoomBtn.addEventListener("click", (e) => {
    leaveRoom();
  });
}
/**
 * Next button click event
 */
function setNextBtn() {
  nextBtn.addEventListener("click", (e) => {
    getId("nextBtnLoading").style.display = "block";
    getId("nextBtnLoading").style.animation =
      "animate-rotate 3s linear infinite";
    nextPeer();
  });
}
/**
 * Handle left buttons - status menù show - hide on body mouse move
 */
function handleBodyOnMouseMove() {
  document.body.addEventListener("mousemove", (e) => {
    showButtonsBarAndMenu();
  });
  checkButtonsBarAndMenu();
}

if (isMobileDevice) {
  // mobile devices
  // always show buttons bar
  buttonsBar.style.display = "block";
  isButtonsVisible = true;
}
/**
 * Setup local audio - video devices - theme ...
 */
function setupMySettings() {
  // tab buttons
  tabRoomBtn.addEventListener("click", (e) => {
    openTab(e, "tabRoom");
  });
  tabDevicesBtn.addEventListener("click", (e) => {
    openTab(e, "tabDevices");
  });
  tabStylingBtn.addEventListener("click", (e) => {
    openTab(e, "tabStyling");
  });
  tabLanguagesBtn.addEventListener("click", (e) => {
    openTab(e, "tabLanguages");
  });
  // select audio input
  audioInputSelect.addEventListener("change", (e) => {
    myVideoChange = false;
    refreshLocalMedia();
  });
  // select audio output
  audioOutputSelect.addEventListener("change", (e) => {
    changeAudioDestination();
  });



  // select video input
  videoSelect.addEventListener("change", (e) => {
    myVideoChange = true;
    refreshLocalMedia();
  });
  // select video quality
  videoQualitySelect.addEventListener("change", (e) => {
    setLocalVideoQuality();
  });
  // select video fps
  videoFpsSelect.addEventListener("change", (e) => {
    videoMaxFrameRate = parseInt(videoFpsSelect.value);
    setLocalMaxFps(videoMaxFrameRate);
  });
  // default 30 fps
  videoFpsSelect.selectedIndex = "1";

  // Firefox not support video cam Fps O.o
  if (myBrowserName === "Firefox") {
    videoFpsSelect.value = null;
    videoFpsSelect.disabled = true;
  }
  // select screen fps
  screenFpsSelect.addEventListener("change", (e) => {
    screenMaxFrameRate = parseInt(screenFpsSelect.value);
    if (isScreenStreaming) setLocalMaxFps(screenMaxFrameRate);
  });
  // default 30 fps
  screenFpsSelect.selectedIndex = "1";

  // Mobile not support screen sharing
  if (isMobileDevice) {
    screenFpsSelect.value = null;
    screenFpsSelect.disabled = true;
  }
  // select themes
  themeSelect.addEventListener("change", (e) => {
    setTheme(themeSelect.value);
  });
  // video object fit
  videoObjFitSelect.addEventListener("change", (e) => {
    document.documentElement.style.setProperty(
      "--video-object-fit",
      videoObjFitSelect.value
    );
  });
  videoObjFitSelect.selectedIndex = 2; // cover

  // Mobile isn't supported with buttons bar position horizontal
  if (isMobileDevice) {
    btnsBarSelect.disabled = true;
  } else {
    btnsBarSelect.addEventListener("change", (e) => {
      setButtonsBarPosition(btnsBarSelect.value);
    });
  }

  // Mobile isn't supported with pin/unpin video feature
  if (!isMobileDevice) {
    pinVideoPositionSelect.addEventListener("change", (e) => {
      toggleVideoPin(pinVideoPositionSelect.value);
    });
  } else {
    getId("pinUnpinGridDiv").style.display = "none";
  }

  // room actions
  muteEveryoneBtn.addEventListener("click", (e) => {
    disableAllPeers("audio");
  });
  hideEveryoneBtn.addEventListener("click", (e) => {
    disableAllPeers("video");
  });
  lockRoomBtn.addEventListener("click", (e) => {
    handleRoomAction({ action: "lock" }, true);
  });
  unlockRoomBtn.addEventListener("click", (e) => {
    handleRoomAction({ action: "unlock" }, true);
  });
}
/**
 * Refresh Local media audio video in - out
 */
function refreshLocalMedia() {
  // some devices can't swap the video track, if already in execution.
  // stopLocalVideoTrack();
  stopLocalAudioTrack();

  navigator.mediaDevices
    .getUserMedia(getAudioVideoConstraints())
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
}

/**
 * Get audio - video constraints
 * @returns {object} audio - video constraints
 */
function getAudioVideoConstraints() {
  const audioSource = localStorage.getItem("audioInputSelect")
    ? localStorage.getItem("audioInputSelect")
    : audioInputSelect.value;
  // userLog("toast", "Selected audio source: " + localStorage.getItem("selectedCamera"));
  const videoSource = localStorage.getItem("selectedCamera")
    ? localStorage.getItem("selectedCamera")
    : videoSelect.value;
  let videoConstraints = false;
  if (useVideo) {
    videoConstraints = getVideoConstraints(
      videoQualitySelect.value ? videoQualitySelect.value : "default"
    );
    videoConstraints["deviceId"] = videoSource
      ? { exact: videoSource }
      : undefined;
  }
  let cameraStatelocal = localStorage.getItem("camera");
  let cameraState =
    cameraStatelocal == "user" ? "user" : { exact: "environment" };
  const vidconsts = getVideoConstraints(
    videoQualitySelect.value ? videoQualitySelect.value : "default"
  );
  if (cameraStatelocal) {
    vidconsts["facingMode"] = cameraState;
  }
  let audioConstraints = {
    deviceId: audioSource ? { exact: audioSource } : undefined,
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  };
  const constraints = {
    audio: audioConstraints,
    video: vidconsts,
  };
  return constraints;
}

/**
 * Get video constraints: https://webrtc.github.io/samples/src/content/getusermedia/resolution/
 * WebCam resolution: https://webcamtests.com/resolution
 * @param {string} videoQuality desired video quality
 * @returns {object} video constraints
 */
function getVideoConstraints(videoQuality) {
  let frameRate = { max: videoMaxFrameRate };

  switch (videoQuality) {
    case "default":
      if (forceCamMaxResolutionAndFps) {
        // This will make the browser use the maximum resolution available as default, `up to 4K and 60fps`.
        return {
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 60 },
        }; // video cam constraints default
      }
      return { frameRate: frameRate };
    case "qvgaVideo":
      return {
        width: { exact: 320 },
        height: { exact: 240 },
        frameRate: frameRate,
      }; // video cam constraints low bandwidth
    case "vgaVideo":
      return {
        width: { exact: 640 },
        height: { exact: 480 },
        frameRate: frameRate,
      }; // video cam constraints medium bandwidth
    case "hdVideo":
      return {
        width: { exact: 1280 },
        height: { exact: 720 },
        frameRate: frameRate,
      }; // video cam constraints high bandwidth
    case "fhdVideo":
      return {
        width: { exact: 1920 },
        height: { exact: 1080 },
        frameRate: frameRate,
      }; // video cam constraints very high bandwidth
    case "2kVideo":
      return {
        width: { exact: 2560 },
        height: { exact: 1440 },
        frameRate: frameRate,
      }; // video cam constraints ultra high bandwidth
    case "4kVideo":
      return {
        width: { exact: 3840 },
        height: { exact: 2160 },
        frameRate: frameRate,
      }; // video cam constraints ultra high bandwidth
  }
}

/**
 * Set local max fps: https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints
 * @param {string} maxFrameRate desired max frame rate
 */
function setLocalMaxFps(maxFrameRate) {
  if (!useVideo) return;
  localMediaStream
    .getVideoTracks()[0]
    .applyConstraints({ frameRate: { max: maxFrameRate } })
    .then(() => {
      logStreamSettingsInfo("setLocalMaxFps", localMediaStream);
    })
    .catch((err) => {
      console.error("setLocalMaxFps", err);
      userLog(
        "error",
        "Your device doesn't support the selected fps, please select the another one."
      );
    });
}

/**
 * Set local video quality: https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints
 */
function setLocalVideoQuality() {
  if (!useVideo) return;
  let videoConstraints = getVideoConstraints(
    videoQualitySelect.value ? videoQualitySelect.value : "default"
  );
  localMediaStream
    .getVideoTracks()[0]
    .applyConstraints(videoConstraints)
    .then(() => {
      logStreamSettingsInfo("setLocalVideoQuality", localMediaStream);
      videoQualitySelectedIndex = videoQualitySelect.selectedIndex;
    })
    .catch((err) => {
      videoQualitySelect.selectedIndex = videoQualitySelectedIndex;
      console.error("setLocalVideoQuality", err);
      userLog(
        "error",
        "Your device doesn't support the selected video quality, please select the another one."
      );
    });
}

/**
 * Change Speaker
 */
function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  logger("AudioDestination ", audioDestination);
  attachSinkId(myVideo, audioDestination);
}

/**
 * Attach audio output device to video element using device/sink ID.
 * @param {object} element video element to attach the audio output
 * @param {string} sinkId uuid audio output device
 */
function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== "undefined") {
    element
      .setSinkId(sinkId)
      .then(() => {
        logger(`Success, audio output device attached: ${sinkId}`, "true");
      })
      .catch((err) => {
        let errorMessage = err;
        if (err.name === "SecurityError")
          errorMessage = `You need to use HTTPS for selecting audio output device: ${err}`;
        console.error(errorMessage);
        // Jump back to first output device in the list as it's the default.
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    logger("Browser does not support output device selection.", "false");
  }
}

/**
 * Got Stream and append to local media
 * @param {object} stream media stream audio - video
 * @returns {object} media Devices Info
 */
async function gotStream(stream) {
  await refreshMyStreamToPeers(stream, true);
  // await refreshMyLocalStream(stream, true);
  camera = localStorage.getItem("camera")
    ? localStorage.getItem("camera")
    : "user";
  if (myVideoChange) {
    setMyVideoStatusTrue();
    // This fix IPadPro - Tablet mirror of the back camera
    if (isMobileDevice || isIPadDevice || isTabletDevice) {
      if (camera == "user") {
        myVideo.classList.add("mirror");
        isCamMirrored = true;
      } else {
        myVideo.classList.remove("mirror");
        isCamMirrored = false;
      }
    }
  }
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

/**
 * Get audio-video Devices and show it to select box
 * https://webrtc.github.io/samples/src/content/devices/input-output/
 * https://github.com/webrtc/samples/tree/gh-pages/src/content/devices/input-output
 * @param {object} deviceInfos device infos
 */
function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  // check devices
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    let isRussian = deviceInfo.label == "По умолчанию";
    switch (deviceInfo.kind) {
      case "videoinput":
        option.text =
          `📹 ` + deviceInfo.label || `📹 camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);
        break;
      case "audioinput":
        if (isRussian) {
          option.text = `🎤 Default`;
        } else {
          option.text = `🎤 ` + deviceInfo.label || `🎤 microphone ${audioInputSelect.length + 1}`;
        }
        audioInputSelect.appendChild(option);
        break;
      case "audiooutput":
        option.text =
          `🔈 ` + deviceInfo.label ||
          `🔈 speaker ${audioOutputSelect.length + 1}`;
        audioOutputSelect.appendChild(option);
        break;
      default:
        console.log("Some other kind of source/device: ", deviceInfo);
    }
  }

  selectors.forEach((select, selectorIndex) => {
    if (
      Array.prototype.slice
        .call(select.childNodes)
        .some((n) => n.value === values[selectorIndex])
    ) {
      select.value = values[selectorIndex];
    }
  });
}

/**
 * Handle getUserMedia error: https://blog.addpipe.com/common-getusermedia-errors/
 * @param {object} err user media error
 */
function handleError(err) {
  console.log("navigator.MediaDevices.getUserMedia error: ", err);
  switch (err.name) {
    case "OverconstrainedError":
      console.log(err);
      break;
    default:
      console.log("GetUserMedia error " + err);
  }
}

/**
 * AttachMediaStream stream to element
 * @param {object} element element to attach the stream
 * @param {object} stream media stream audio - video
 */
function attachMediaStream(element, vid) {
  element.srcObject = vid;
  if (myBrowserName === "Safari") {
    element.onloadedmetadata = function () {
      let videoPlayPromise = element.play();
      if (videoPlayPromise !== undefined) {
        videoPlayPromise
          .then(function () {
            console.log("Safari - automatic playback started!");
          })
          .catch(function (err) {
            console.error("Safari - automatic playback error", err);
          });
      }
    };
  }
}

/**
 * Show left buttons & status
 * if buttons visible or I'm on hover do nothing return
 * if mobile and chatroom open do nothing return
 * if mobile and myCaption visible do nothing
 * if mobile and mySettings open do nothing return
 */


function showButtonsBarAndMenu() {
  if (isMobileDevice) {
    buttonsBar.style.display = "flex";
    isButtonsVisible = true;
    return;
  }
  if (
    isButtonsBarOver ||
    isButtonsVisible ||
    (isMobileDevice && isChatRoomVisible) ||
    (isMobileDevice && isCaptionBoxVisible) ||
    (isMobileDevice && isMySettingsVisible)
  )
    return;
  buttonsBar.style.display = "flex";
  isButtonsVisible = true;
}

/**
 * Check every 10 sec if need to hide buttons bar and status menu
 */
function checkButtonsBarAndMenu() {
  // if it's mobile don't hide buttons
  toggleClassElements("navbar", "none");
  if (!isButtonsBarOver) {
    buttonsBar.style.display = "none";
    isButtonsVisible = false;
  }

  // check again after 8 sec if it's not mobile
  setTimeout(() => {
    if (!isMobileDevice) checkButtonsBarAndMenu();
  }, 1000000);
}

/**
 * Copy room url to clipboard and share it with navigator share if supported
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
 */
async function shareRoomUrl() {
  const myRoomUrl = window.location.href;

  // navigator share
  let isSupportedNavigatorShare = false;
  let errorNavigatorShare = false;
  // if supported
  if (navigator.share) {
    isSupportedNavigatorShare = true;
    try {
      // not add title and description to load metadata from url
      await navigator.share({ url: myRoomUrl });
      userLog("toast", "Room Shared successfully!");
    } catch (err) {
      errorNavigatorShare = true;
    }
  }

  // something wrong or not supported navigator.share
  if (
    !isSupportedNavigatorShare ||
    (isSupportedNavigatorShare && errorNavigatorShare)
  ) {
    // playSound("newMessage");
    Swal.fire({
      background: swalBackground,
      position: "center",
      title: "Share Room",
      // imageAlt: 'Share',
      // imageUrl: shareUrlImg,
      html:
        `
            <br/>
            <div id="qrRoomContainer">
                <canvas id="qrRoom"></canvas>
            </div>
            <br/><br/>
            <p style="color:white;"> Invite others to join. Share this meeting link.</p>
            <p style="color:rgb(8, 189, 89);">` +
        myRoomUrl +
        `</p>`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Copy URL`,
      denyButtonText: `Email invite`,
      cancelButtonText: `Close`,
      showClass: {
        popup: "animate__animated animate__fadeInDown",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        copyRoomURL();
      } else if (result.isDenied) {
        let message = {
          email: "",
          subject: "Please join our Videochat conference",
          body: "Click to join: " + myRoomUrl,
        };
        shareRoomByEmail(message);
      }
    });
    makeRoomQR();
  }
}

/**
 * Make Room QR
 * https://github.com/neocotic/qrious
 */
function makeRoomQR() {
  let qr = new QRious({
    element: getId("qrRoom"),
    value: window.location.href,
  });
  qr.set({
    size: 256,
  });
}

/**
 * Copy Room URL to clipboard
 */
function copyRoomURL() {
  let roomURL = window.location.href;
  let tmpInput = document.createElement("input");
  document.body.appendChild(tmpInput);
  tmpInput.value = roomURL;
  tmpInput.select();
  tmpInput.setSelectionRange(0, 99999); // For mobile devices
  navigator.clipboard.writeText(tmpInput.value);
  console.log("Copied to clipboard Join Link ", roomURL);
  document.body.removeChild(tmpInput);
  userLog("toast", "Meeting URL copied to clipboard 👍");
}

/**
 * Share room id by email
 * @param {object} message content: email | subject | body
 */
function shareRoomByEmail(message) {
  let email = message.email;
  let subject = message.subject;
  let emailBody = message.body;
  document.location =
    "mailto:" + email + "?subject=" + subject + "&body=" + emailBody;
}

/**
 * Handle Audio ON - OFF
 * @param {object} e event
 * @param {boolean} init on join room
 * @param {null|boolean} force audio off (default null can be true/false)
 */
function handleAudio(e, init, force = null) {
  if (!useAudio) return;
  localMediaStream.getAudioTracks()[0].enabled =
    force != null ? force : !localMediaStream.getAudioTracks()[0].enabled;
  myAudioStatus = localMediaStream.getAudioTracks()[0].enabled;

  force != null
    ? (e.className = myAudioStatus ? className.audioOn : className.audioOff)
    : (e.target.className = myAudioStatus
      ? className.audioOn
      : className.audioOff);

  if (init) {
    audioBtn.className = myAudioStatus ? className.audioOn : className.audioOff;
    setTippy(
      initAudioBtn,
      myAudioStatus ? "Ovozni o'chirish" : "Ovozni yoqish",
      "top"
    );
  }
  setMyAudioStatus(myAudioStatus);
}

/**
 * Handle Video ON - OFF
 * @param {object} e event
 * @param {boolean} init on join room
 * @param {null|boolean} force video off (default null can be true/false)
 */
function handleVideo(e, init, force = null) {
  if (!useVideo) return;
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/getVideoTracks

  localMediaStream.getVideoTracks()[0].enabled =
    force != null ? force : !localMediaStream.getVideoTracks()[0].enabled;
  myVideoStatus = localMediaStream.getVideoTracks()[0].enabled;

  force != null
    ? (e.className = myVideoStatus ? className.videoOn : className.videoOff)
    : (e.target.className = myVideoStatus
      ? className.videoOn
      : className.videoOff);

  if (init) {
    videoBtn.className = myVideoStatus ? className.videoOn : className.videoOff;
    setTippy(
      initVideoBtn,
      myVideoStatus ? "Videoni yopish" : "Videoni ochish",
      "top"
    );
  }
  setMyVideoStatus(myVideoStatus);
}

/**
 * SwapCamera front (user) - rear (environment)
 */
async function swapCamera() {
  // setup camera
  let camVideo = false;
  camera = camera == "user" ? "environment" : "user";
  camVideo = camera == "user" ? true : { facingMode: { exact: camera } };
  // save camera to localStorage
  localStorage.setItem("camera", camera);
  localStorage.setItem("selectedCamera", videoSelect.value);
  // some devices can't swap the cam, if have Video Track already in execution.
  await stopLocalVideoTrack();

  let camStream = null;
  try {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    camStream = await navigator.mediaDevices.getUserMedia({ video: camVideo });
    if (camStream) {
      await refreshMyStreamToPeers(camStream);
      await refreshMyLocalStream(camStream);
      await setMyVideoStatusTrue();
      if (camera == "user") {
        myVideo.classList.add("mirror");
        isCamMirrored = true;
      } else {
        myVideo.classList.remove("mirror");
        isCamMirrored = false;
      }
    }
  } catch (err) {
    console.log("[Error] to swapping camera", err);
  }
}

async function swapCameraTo(cameraType) {
  // setup camera
  let camVideo = false;
  camera = cameraType;
  camVideo = camera == "user" ? true : { facingMode: { exact: camera } };
  // save camera to localStorage
  localStorage.setItem("camera", camera);
  // some devices can't swap the cam, if have Video Track already in execution.
  stopLocalVideoTrack();

  let camStream = null;

  try {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    camStream = await navigator.mediaDevices.getUserMedia({ video: camVideo });
    if (camStream) {
      await refreshMyStreamToPeers(camStream);
      await refreshMyLocalStream(camStream);
      await setMyVideoStatusTrue();
      if (camera == "user") {
        myVideo.classList.add("mirror");
        isCamMirrored = true;
      } else {
        myVideo.classList.remove("mirror");
        isCamMirrored = false;
      }
    }
  } catch (err) {
    console.log("[Error] to swapping camera", err);
    userLog("error", "Error to swapping the camera " + err);
    // https://blog.addpipe.com/common-getusermedia-errors/
  }
}

/**
 * Stop Local Video Track
 */
async function stopLocalVideoTrack() {
  if (useVideo || !isScreenStreaming)
    localMediaStream.getVideoTracks()[0].stop();
}

/**
 * Stop Local Audio Track
 */
function stopLocalAudioTrack() {
  localMediaStream.getAudioTracks()[0].stop();
}

/**
 * Enable - disable screen sharing
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
 */
async function toggleScreenSharing() {
  screenMaxFrameRate = parseInt(screenFpsSelect.value);
  const constraints = {
    audio: true, // enable tab audio
    video: { frameRate: { max: screenMaxFrameRate } },
  }; // true | { frameRate: { max: screenMaxFrameRate } }

  let screenMediaPromise = null;

  let myPrivacyBtn = getId("myPrivacyBtn");

  try {
    screenMediaPromise = isScreenStreaming
      ? await navigator.mediaDevices.getUserMedia(getAudioVideoConstraints())
      : await navigator.mediaDevices.getDisplayMedia(constraints);
    if (screenMediaPromise) {
      isVideoPrivacyActive = false;
      emitPeerStatus("privacy", isVideoPrivacyActive);
      isScreenStreaming = !isScreenStreaming;
      if (isScreenStreaming) {
        setMyVideoStatusTrue();
        emitPeersAction("screenStart");
      } else {
        emitPeersAction("screenStop");
        adaptAspectRatio();
      }
      myScreenStatus = isScreenStreaming;
      await emitPeerStatus("screen", myScreenStatus);
      await stopLocalVideoTrack();
      await refreshMyLocalStream(screenMediaPromise);
      await refreshMyStreamToPeers(screenMediaPromise);
      myVideo.classList.toggle("mirror");
      if (myVideoAvatarImage && !useVideo)
        myVideoAvatarImage.style.display = isScreenStreaming ? "none" : "block";
      if (myPrivacyBtn)
        myPrivacyBtn.style.display = isScreenStreaming ? "none" : "inline";
      if (isScreenStreaming || isVideoPinned) getId("myVideoPinBtn").click();
    }
  } catch (err) {
    console.error("[Error] Unable to share the screen", err);
    userLog("error", "Unable to share the screen " + err);
  }
}

/**
 * Set myVideoStatus true
 */
async function setMyVideoStatusTrue() {
  if (myVideoStatus || !useVideo) return;
  // Put video status already ON
  localMediaStream.getVideoTracks()[0].enabled = true;
  myVideoStatus = true;
  videoBtn.className = className.videoOn;
  myVideoStatusIcon.className = className.videoOn;
  myVideoAvatarImage.style.display = "none";
  emitPeerStatus("video", myVideoStatus);
  setTippy(videoBtn, "Videoni yopish", "right-start");
}

/**
 * Enter - esc on To'liq ekran
 * https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
 */
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fullScreenBtn.className = className.fsOn;
    isDocumentOnFullScreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      fullScreenBtn.className = className.fsOff;
      isDocumentOnFullScreen = false;
    }
  }
  setTippy(
    fullScreenBtn,
    isDocumentOnFullScreen ? "To'liq ekranni yopish" : "To'liq ekran",
    "right-start"
  );
}

/**
 * Refresh my stream changes to connected peers in the room
 * @param {object} stream media stream audio - video
 * @param {boolean} localAudioTrackChange default false
 */
async function refreshMyStreamToPeers(stream, localAudioTrackChange = false) {
  if (!thereIsPeerConnections()) return;

  console.log("PEER-CONNECTIONS", peerConnections); // all peers connections in the room expect myself
  console.log("ALL-PEERS", allPeers); // all peers connected in the room

  // refresh my stream to connected peers expect myself
  for (let peer_id in peerConnections) {
    let peer_name = allPeers[peer_id]["peer_name"];

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getSenders
    let videoSender = peerConnections[peer_id]
      .getSenders()
      .find((s) => (s.track ? s.track.kind === "video" : false));
    console.log("CHECK VIDEO SENDER - " + peer_name, videoSender);

    if (videoSender) {
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/replaceTrack
      videoSender.replaceTrack(stream.getVideoTracks()[0]);
      console.log("REPLACE VIDEO TRACK TO", {
        peer_id: peer_id,
        peer_name: peer_name,
      });
    } else {
      stream.getTracks().forEach((track) => {
        if (track.kind === "video") {
          // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addTrack
          peerConnections[peer_id].addTrack(track);
          handleRtcOffer(peer_id); // https://groups.google.com/g/discuss-webrtc/c/Ky3wf_hg1l8?pli=1
        }
      });
    }

    let myAudioTrack; // audio Track to replace to peers

    if (
      stream.getAudioTracks()[0] &&
      (localAudioTrackChange || isScreenStreaming)
    ) {
      myAudioTrack = stream.getAudioTracks()[0];
    } else {
      myAudioTrack = localMediaStream.getAudioTracks()[0];
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getSenders
    let audioSender = peerConnections[peer_id]
      .getSenders()
      .find((s) => (s.track ? s.track.kind === "audio" : false));

    if (audioSender) {
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/replaceTrack
      audioSender.replaceTrack(myAudioTrack);
      console.log("REPLACE AUDIO TRACK TO", {
        peer_id: peer_id,
        peer_name: peer_name,
      });
    }

    // When share a video tab that contain audio, my voice will be turned off
    if (isScreenStreaming && stream.getAudioTracks()[0]) {
      setMyAudioOff("you");
      needToEnableMyAudio = true;
      audioBtn.disabled = true;
    }
    // On end screen sharing enable my audio if need
    if (!isScreenStreaming && needToEnableMyAudio) {
      setMyAudioOn("you");
      needToEnableMyAudio = false;
      audioBtn.disabled = false;
    }
  }
}

/**
 * Refresh my local stream
 * @param {object} stream media stream audio - video
 * @param {boolean} localAudioTrackChange default false
 */
async function refreshMyLocalStream(stream, localAudioTrackChange = false) {
  if (useVideo || isScreenStreaming) stream.getVideoTracks()[0].enabled = true;

  // enable audio
  if (localAudioTrackChange && myAudioStatus === false) {
    audioBtn.className = className.audioOn;
    setMyAudioStatus(true);
    myAudioStatus = true;
  }

  let newStream = null;

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
  if (useVideo || isScreenStreaming) {
    console.log("Refresh my local media stream VIDEO - AUDIO");
    newStream = new MediaStream([
      stream.getVideoTracks()[0],
      localAudioTrackChange
        ? stream.getAudioTracks()[0]
        : localMediaStream.getAudioTracks()[0],
    ]);
  } else {
    console.log("Refresh my local media stream AUDIO");
    newStream = new MediaStream([
      localAudioTrackChange
        ? stream.getAudioTracks()[0]
        : localMediaStream.getAudioTracks()[0],
    ]);
  }

  localMediaStream = newStream;

  // refresh video privacy mode on screen sharing
  if (isScreenStreaming) {
    isVideoPrivacyActive = false;
    setVideoPrivacyStatus("myVideo", isVideoPrivacyActive);
  }

  // adapt video object fit on screen streaming
  getId("myVideo").style.objectFit = isScreenStreaming
    ? "contain"
    : "var(--video-object-fit)";

  // log newStream devices
  logStreamSettingsInfo("refreshMyLocalStream", localMediaStream);

  // start capture mic volumes
  startPitchDetection(localMediaStream);

  // attachMediaStream is a part of the adapter.js library
  attachMediaStream(myVideo, localMediaStream); // newstream

  // on toggleScreenSharing video stop
  if (useVideo || isScreenStreaming) {
    stream.getVideoTracks()[0].onended = () => {
      toggleScreenSharing();
    };
  }
  if (useVideo && myVideoStatus === false)
    localMediaStream.getVideoTracks()[0].enabled = false;
}

/**
 * Notify me if someone start to recording they screen + audio
 * @param {string} from peer_name
 * @param {string} action recording action
 */
function notifyRecording(from, action) {
  let msg = "[ 🔴 REC ] : " + action + " to recording his own screen and audio";
  let chatMessage = {
    from: from,
    to: myPeerName,
    msg: msg,
    privateMsg: false,
  };
  handleDataChannelChat(chatMessage);
  userLog("toast", from + " " + msg);
}

/**
 * Create Chat Room Data Channel
 * @param {string} peer_id socket.id
 */
function createChatDataChannel(peer_id) {
  chatDataChannels[peer_id] = peerConnections[peer_id].createDataChannel(
    "videolify_chat_channel"
  );
  chatDataChannels[peer_id].onopen = (event) => {
    console.log("chatDataChannels created", event);
  };
}

/**
 * Set the chat room on To'liq ekran for mobile
 */
function setChatRoomAndCaptionForMobile() {
  if (isMobileDevice) {
    document.documentElement.style.setProperty("--msger-height", "70%");
    document.documentElement.style.setProperty("--msger-width", "99%");
  } else {
    // make chat room draggable for desktop
    dragElement(msgerDraggable, msgerHeader);
    // make caption draggable for desktop
    dragElement(captionDraggable, captionHeader);
  }
}

/**
 * Show msger draggable on center screen position
 */
function showChatRoomDraggable() {
  // playSound("newMessage");
  if (isMobileDevice) {
    buttonsBar.style.display = "none";
    isButtonsVisible = false;
  }
  msgerDraggable.style.top = "45%";
  msgerDraggable.style.left = isMobileDevice ? "50%" : "25%";
  msgerDraggable.style.display = "flex";
  isChatRoomVisible = true;
}

/**
 * Clean chat messages
 */
function cleanMessages() {
  // playSound("newMessage");
  Swal.fire({
    background: swalBackground,
    position: "center",
    title: "Hammasi o'chirilsinmi?",
    imageUrl: deleteImg,
    showDenyButton: true,
    confirmButtonText: `Ha`,
    denyButtonText: `Yo'q`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    // clean chat messages
    if (result.isConfirmed) {
      let msgs = msgerChat.firstChild;
      while (msgs) {
        msgerChat.removeChild(msgs);
        msgs = msgerChat.firstChild;
      }
      // clean object
      chatMessages = [];
      playSound("delete");
    }
  });
}

/**
 * Clean captions
 */
function cleanCaptions() {
  playSound("newMessage");
  Swal.fire({
    background: swalBackground,
    position: "center",
    title: "Clean up all caption transcripts?",
    imageUrl: deleteImg,
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    // clean chat messages
    if (result.isConfirmed) {
      let captions = captionChat.firstChild;
      while (captions) {
        captionChat.removeChild(captions);
        captions = captionChat.firstChild;
      }
      // clean object
      transcripts = [];
      playSound("delete");
    }
  });
}

/**
 * Hide chat room and emoji picker
 */
function hideChatRoomAndEmojiPicker() {
  msgerDraggable.style.display = "none";
  msgerEmojiPicker.style.display = "none";
  msgerEmojiBtn.style.color = "#FFFFFF";

  isChatRoomVisible = false;
  isChatEmojiVisible = false;
}

/**
 * Send Chat messages to peers in the room
 */
function sendChatMessage() {
  if (!thereIsPeerConnections()) {
    cleanMessageInput();
    isChatPasteTxt = false;
    return userLog("info", "Sherik yo'q, jo'natib bo'lmaydi");
  }

  const msg = checkMsg(msgerInput.value);
  // empity msg or
  if (!msg) {
    isChatPasteTxt = false;
    return cleanMessageInput();
  }

  emitMsg(myPeerName, "toAll", msg, false, myPeerId);
  appendMessage(myPeerName, rightChatAvatar, "right", msg, false);
  cleanMessageInput();
}

/**
 * handle Incoming Data Channel Chat Messages
 * @param {object} dataMessage chat messages
 */
function handleDataChannelChat(dataMessage) {
  if (!dataMessage) return;

  let msgFrom = dataMessage.from;
  let msgTo = dataMessage.to;
  let msg = dataMessage.msg;
  let msgPrivate = dataMessage.privateMsg;
  let msgId = dataMessage.id;

  // private message but not for me return
  if (msgPrivate && msgTo != myPeerName) return;

  console.log("handleDataChannelChat", dataMessage);

  // chat message for me also
  if (!isChatRoomVisible && showChatOnMessage) {
    showChatRoomDraggable();
  }
  // show message from
  if (!showChatOnMessage) {
    userLog("toast", `New message from: ${msgFrom}`);
  }
  playSound("chatMessage");
  setPeerChatAvatarImgName("left", msgFrom);
  appendMessage(msgFrom, leftChatAvatar, "left", msg, msgPrivate, msgId);
}

/**
 * Clean input txt message
 */
function cleanMessageInput() {
  msgerInput.value = "";
  msgerInput.style.height = "25px";
}

/**
 * Paste from clipboard to input txt message
 */
function pasteToMessageInput() {
  navigator.clipboard
    .readText()
    .then((text) => {
      msgerInput.value += text;
      isChatPasteTxt = true;
      checkLineBreaks();
    })
    .catch((err) => {
      console.error("Failed to read clipboard contents: ", err);
    });
}
/**
 * Escape Special Chars
 * @param {string} regex string to replace
 */
function escapeSpecialChars(regex) {
  return regex.replace(/([()[{*+.$^\\|?])/g, "\\$1");
}

/**
 * Append Message to msger chat room
 * @param {string} from peer name
 * @param {string} img images url
 * @param {string} side left/right
 * @param {string} msg message to append
 * @param {boolean} privateMsg if is private message
 * @param {string} msgId peer id
 */
function appendMessage(from, img, side, msg, privateMsg, msgId = null) {
  let time = getFormatDate(new Date());

  // collect chat msges to save it later
  chatMessages.push({
    time: time,
    from: from,
    msg: msg,
    privateMsg: privateMsg,
  });

  // check if i receive a private message
  let msgBubble = privateMsg ? "private-msg-bubble" : "msg-bubble";

  let msgHTML = `
	<div id="msg-${chatMessagesId}" class="msg ${side}-msg">
		<div class="msg-img" style="background-image: url('${img}')"></div>
		<div class=${msgBubble}>
            <div class="msg-info">
                <div class="msg-info-name">${side == "left" ? "U" : "Siz"}</div>
                <div class="msg-info-time">${time}</div>
            </div>
            <div id="${chatMessagesId}" class="msg-text">${msg}
    `;
  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
  setTippy(getId("msg-delete-" + chatMessagesId), "Delete", "top");
  setTippy(getId("msg-copy-" + chatMessagesId), "Copy", "top");
  setTippy(getId("msg-private-reply-" + chatMessagesId), "Reply", "top");
  chatMessagesId++;
}
/**
 * Delete message
 * @param {string} id msg id
 */
function deleteMessage(id) {
  playSound("newMessage");
  Swal.fire({
    background: swalBackground,
    position: "center",
    title: "Delete this messages?",
    imageUrl: deleteImg,
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    // clean this message
    if (result.isConfirmed) {
      getId(id).remove();
      playSound("delete");
    }
  });
}

/**
 * Copy the element innerText on clipboard
 * @param {string} id
 */
function copyToClipboard(id) {
  const text = getId(id).innerText;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      msgPopup("success", "Message copied!", "top-end", 1000);
    })
    .catch((err) => {
      msgPopup("error", err, "top-end", 2000);
    });
}

/**
 * Add participants in the chat room lists
 * @param {object} peers all peers info connected to the same room
 */
async function msgerAddPeers(peers) {
  // console.log("peers", peers);
  // add all current Participants
  for (let peer_id in peers) {
    let peer_name = peers[peer_id]["peer_name"];
    // bypass insert to myself in the list :)
    if (peer_id != myPeerId) {
      let exsistMsgerPrivateDiv = getId(peer_id + "_pMsgDiv");
      // if there isn't add it....
      if (!exsistMsgerPrivateDiv) {
        let msgerPrivateDiv = `
                <div id="${peer_id}_pMsgDiv" class="msger-peer-inputarea">
                    <img id="${peer_id}_pMsgAvatar" src='${avatarApiUrl}?name=${peer_name || localStorage.getItem("peerName") || "Anonymous"
          }&size=24&background=random&rounded=true'> 
                    <textarea
                        rows="1"
                        cols="1"
                        id="${peer_id}_pMsgInput"
                        class="msger-input"
                        placeholder="💬 Enter your message..."
                    ></textarea>
                    <button id="${peer_id}_pMsgBtn" class=className.msgPrivate value="${peer_name}"></button>
                </div>
                `;
        msgerCPList.insertAdjacentHTML("beforeend", msgerPrivateDiv);
        msgerCPList.scrollTop += 500;

        let msgerPrivateMsgInput = getId(peer_id + "_pMsgInput");
        let msgerPrivateBtn = getId(peer_id + "_pMsgBtn");
        addMsgerPrivateBtn(msgerPrivateBtn, msgerPrivateMsgInput, myPeerId);
      }
    }
  }
}

/**
 * Search peer by name in chat room lists to send the private messages
 */
function searchPeer() {
  let searchPeerBarName = getId("searchPeerBarName").value;
  let msgerPeerInputarea = getEcN("msger-peer-inputarea");
  searchPeerBarName = searchPeerBarName.toLowerCase();
  for (let i = 0; i < msgerPeerInputarea.length; i++) {
    if (
      !msgerPeerInputarea[i].innerHTML.toLowerCase().includes(searchPeerBarName)
    ) {
      msgerPeerInputarea[i].style.display = "none";
    } else {
      msgerPeerInputarea[i].style.display = "flex";
    }
  }
}

/**
 * Remove participant from chat room lists
 * @param {string} peer_id socket.id
 */
function msgerRemovePeer(peer_id) {
  let msgerPrivateDiv = getId(peer_id + "_pMsgDiv");
  if (msgerPrivateDiv) {
    let peerToRemove = msgerPrivateDiv.firstChild;
    while (peerToRemove) {
      msgerPrivateDiv.removeChild(peerToRemove);
      peerToRemove = msgerPrivateDiv.firstChild;
    }
    msgerPrivateDiv.remove();
  }
}

/**
 * Setup msger buttons to send private messages
 * @param {object} msgerPrivateBtn chat private message send button
 * @param {object} msgerPrivateMsgInput chat private message text input
 * @param {string} peerId chat peer_id
 */
function addMsgerPrivateBtn(msgerPrivateBtn, msgerPrivateMsgInput, peerId) {
  // add button to send private messages
  msgerPrivateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sendPrivateMessage();
  });

  // Number 13 is the "Enter" key on the keyboard
  msgerPrivateMsgInput.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      sendPrivateMessage();
    }
  });

  msgerPrivateMsgInput.onpaste = () => {
    isChatPasteTxt = true;
  };

  function sendPrivateMessage() {
    let pMsg = checkMsg(msgerPrivateMsgInput.value);
    if (!pMsg) {
      msgerPrivateMsgInput.value = "";
      isChatPasteTxt = false;
      return;
    }
    let toPeerName = msgerPrivateBtn.value;
    emitMsg(myPeerName, toPeerName, pMsg, true, peerId);
    appendMessage(
      myPeerName,
      rightChatAvatar,
      "right",
      pMsg + "<hr>Private message to " + toPeerName,
      true
    );
    msgerPrivateMsgInput.value = "";
    msgerCP.style.display = "none";
  }
}

/**
 * Check Message
 * Detect url from text and make it clickable
 * If url is a img to create preview of it
 * Prevent XSS (strip html part)
 * @param {string} text passed text
 * @returns {string} html format
 */
function checkMsg(text) {
  if (text.trim().length == 0) return;
  if (isHtml(text)) return stripHtml(text);
  if (isValidHttpURL(text)) {
    if (isImageURL(text))
      return '<img src="' + text + '" alt="img" width="180" height="auto"/>';
    return '<a href="' + text + '" target="_blank">' + text + "</a>";
  }
  if (isChatMarkdownOn) return marked.parse(text);
  let pre = "<pre>" + text + "</pre>";
  if (isChatPasteTxt) {
    isChatPasteTxt = false;
    return pre;
  }
  if (getLineBreaks(text) > 1) {
    return pre;
  }
  return text;
}

/**
 * Strip Html
 * @param {string} html code
 * @returns only text from html
 */
function stripHtml(html) {
  // return html.replace(/<[^>]+>/g, '');
  let doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

/**
 * Check if string contain html
 * @param {string} str
 * @returns
 */
function isHtml(str) {
  let a = document.createElement("div");
  a.innerHTML = str;
  for (let c = a.childNodes, i = c.length; i--;) {
    if (c[i].nodeType == 1) return true;
  }
  return false;
}

/**
 * Check if valid URL
 * @param {string} str to check
 * @returns boolean true/false
 */
function isValidHttpURL(str) {
  let url;
  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * Check if url passed is a image
 * @param {string} url to check
 * @returns {boolean} true/false
 */
function isImageURL(url) {
  return url.match(/\.(jpeg|jpg|gif|png|tiff|bmp)$/) != null;
}

/**
 * Get text Line breaks
 * @param {string} text
 * @returns integer lines
 */
function getLineBreaks(text) {
  return (text.match(/\n/g) || []).length;
}

/**
 * Check chat input line breaks
 */
function checkLineBreaks() {
  msgerInput.style.height = "";
  if (getLineBreaks(msgerInput.value) > 0) {
    msgerInput.style.height = "200px";
  }
}

/**
 * Format date
 * @param {object} date
 * @returns {string} date format h:m:s
 */
function getFormatDate(date) {
  const time = date.toTimeString().split(" ")[0];
  return `${time}`;
}

/**
 * Send message over Secure dataChannels
 * @param {string} from peer name
 * @param {string} to peer name
 * @param {string} msg message to send
 * @param {boolean} privateMsg if is a private message
 * @param {string} id peer_id
 */
function emitMsg(from, to, msg, privateMsg, id) {
  if (!msg) return;

  let chatMessage = {
    type: "chat",
    from: from,
    id: id,
    to: to,
    msg: msg,
    privateMsg: privateMsg,
  };
  console.log("Send msg", chatMessage);
  sendToDataChannel(chatMessage);
}

/**
 * Hide - Show emoji picker div
 */
function hideShowEmojiPicker() {
  if (!isChatEmojiVisible) {
    msgerEmojiPicker.style.display = "block";
    msgerEmojiBtn.style.color = "#FFFF00";
    isChatEmojiVisible = true;
    return;
  }
  msgerEmojiPicker.style.display = "none";
  msgerEmojiBtn.style.color = "#FFFFFF";
  isChatEmojiVisible = false;
}

/**
 * Download Chat messages in json format
 * https://developer.mozilla.org/it/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 */
function downloadChatMsgs() {
  let a = document.createElement("a");
  a.href =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(chatMessages, null, 1));
  a.download = getDataTimeString() + "-CHAT.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


/**
 * Hide - show my settings
 */
function hideShowMySettings() {
  if (!isMySettingsVisible) {
    if (isMobileDevice) {
      document.documentElement.style.setProperty(
        "--mySettings-select-w",
        "99%"
      );
    }
    showAudioDevices("false");
    // my current peer name
    myPeerNameSet.placeholder =
      myPeerName || window.localStorage.getItem("peer_name");
    // center screen on show
    getId("cameraChangeBtn").style.display = "none";
    mySettings.style.top = "50%";
    mySettings.style.left = "50%";
    mySettings.style.display = "block";
    isMySettingsVisible = true;
    return;
  }
  mySettings.style.display = "none";
  isMySettingsVisible = false;
}

/**
 * Handle html tab settings
 * https://www.w3schools.com/howto/howto_js_tabs.asp
 * @param {object} evt event
 * @param {string} tabName name of the tab to open
 */
function openTab(evt, tabName) {
  let i, tabcontent, tablinks;
  tabcontent = getEcN("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = getEcN("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  getId(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

/**
 * Update myPeerName to other peers in the room
 */
function updateMyPeerName() {
  let myNewPeerName = myPeerNameSet.value;
  let myOldPeerName = myPeerName;

  // myNewPeerName empty
  if (!myNewPeerName) return;

  myPeerName = myNewPeerName;
  myVideoParagraph.innerHTML =
    (myPeerName || window.localStorage.getItem("peer_name")) + " (me)";

  sendToServer("peerName", {
    room_id: roomId,
    peer_name_old: myOldPeerName,
    peer_name_new: myPeerName,
  });

  myPeerNameSet.value = "";
  myPeerNameSet.placeholder = myPeerName;

  window.localStorage.peer_name = myPeerName;

  setPeerAvatarImgName("myVideoAvatarImage", useAvatarApi);
  setPeerChatAvatarImgName("right", myPeerName);
  userLog("toast", "Ism o'zgartirildi: " + myPeerName);
}

/**
 * Append updated peer name to video player
 * @param {object} config data
 */
function handlePeerName(config) {
  let peer_id = config.peer_id;
  let peer_name = config.peer_name;
  let videoName = getId(peer_id + "_name");
  if (videoName) videoName.innerHTML = peer_name;
  // change also avatar and btn value - name on chat lists....
  let msgerPeerName = getId(peer_id + "_pMsgBtn");
  let msgerPeerAvatar = getId(peer_id + "_pMsgAvatar");
  if (msgerPeerName) msgerPeerName.value = peer_name;
  if (msgerPeerAvatar)
    msgerPeerAvatar.src = `${avatarApiUrl}?name=${peer_name || window.localStorage.getItem("peer_name")
      }&size=24&background=random&rounded=true`;
  // refresh also peer video avatar name
  setPeerAvatarImgName(peer_id + "_avatar", useAvatarApi);
}

/**
 * Send my Video-Audio-Hand... status
 * @param {string} element typo
 * @param {boolean} status true/false
 */
async function emitPeerStatus(element, status) {
  sendToServer("peerStatus", {
    room_id: roomId,
    peer_name: myPeerName || "A participant",
    element: element,
    status: status,
  });
}

/**
 * Set My Audio Status Icon and Title
 * @param {boolean} status of my audio
 */
function setMyAudioStatus(status) {
  myAudioStatusIcon.className = className.audioOn + (status ? "" : "-slash");

  // send my audio status to all peers in the room
  emitPeerStatus("audio", status);
  setTippy(
    myAudioStatusIcon,
    status ? "You're unmuted" : "You're muted",
    "bottom"
  );

  status ? playSound("on") : playSound("off");
  setTippy(
    audioBtn,
    status ? "Ovozni o'chirish" : "Ovozni yoqish",
    "right-start"
  );
}

/**
 * Set My Video Status Icon and Title
 * @param {boolean} status of my video
 */
function setMyVideoStatus(status) {
  // on vdeo OFF display my video avatar name
  if (myVideoAvatarImage)
    myVideoAvatarImage.style.display = status ? "none" : "block";
  if (myVideoStatusIcon)
    myVideoStatusIcon.className = status
      ? className.videoOn
      : className.videoOff;
  // send my video status to all peers in the room
  emitPeerStatus("video", status);
  if (!isMobileDevice) {
    if (myVideoStatusIcon)
      setTippy(
        myVideoStatusIcon,
        status ? "My video is on" : "My video is off",
        "bottom"
      );
    setTippy(
      videoBtn,
      status ? "Videoni yopish" : "Videoni ochish",
      "right-start"
    );
  }
  status ? playSound("on") : playSound("off");
}

/**
 * Handle peer audio - video - hand - privacy status
 * @param {object} config data
 */
function handlePeerStatus(config) {
  let peer_id = config.peer_id;
  let element = config.element;
  let status = config.status;

  switch (element) {
    case "video":
      setPeerVideoStatus(peer_id, status);
      break;
    case "audio":
      setPeerAudioStatus(peer_id, status);
      break;
    case "privacy":
      setVideoPrivacyStatus(peer_id + "_video", status);
      break;
  }
}

/**
 * Set Participant Audio Status Icon and Title
 * @param {string} peer_id socket.id
 * @param {boolean} status of peer audio
 */
function setPeerAudioStatus(peer_id, status) {
  let peerAudioStatus = getId(peer_id + "_audioStatus");
  if (peerAudioStatus) {
    peerAudioStatus.className = className.audioOn + (status ? "" : "-slash");
    setTippy(
      peerAudioStatus,
      status ? "Ishtirokchini ovozi yoniq" : "Ishtirokchini ovozi o'chirilgan",
      "bottom"
    );
    status ? playSound("on") : playSound("off");
  }
}

/**
 * Handle Peer audio volume 0/100
 * @param {string} audioVolumeId audio volume input id
 * @param {string} mediaId media id
 */
function handleAudioVolume(audioVolumeId, mediaId) {
  let media = getId(mediaId);
  let audioVolume = getId(audioVolumeId);
  if (audioVolume && media) {
    audioVolume.style.maxWidth = "40px";
    audioVolume.style.display = "inline";
    audioVolume.style.cursor = "pointer";
    audioVolume.value = 100;
    audioVolume.addEventListener("input", () => {
      media.volume = audioVolume.value / 100;
    });
  }
}

/**
 * Mute Audio to specific user in the room
 * @param {string} peer_id socket.id
 */
function handlePeerAudioBtn(peer_id) {
  if (!buttons.remote.audioBtnClickAllowed) return;
  let peerAudioBtn = getId(peer_id + "_audioStatus");
  peerAudioBtn.onclick = () => {
    if (peerAudioBtn.className === className.audioOn)
      disablePeer(peer_id, "audio");
  };
}

/**
 * Hide Video to specified peer in the room
 * @param {string} peer_id socket.id
 */
function handlePeerVideoBtn(peer_id) {
  if (!useVideo || !buttons.remote.videoBtnClickAllowed) return;
  let peerVideoBtn = getId(peer_id + "_videoStatus");
  peerVideoBtn.onclick = () => {
    if (peerVideoBtn.className === className.videoOn)
      disablePeer(peer_id, "video");
  };
}

/**
 * Send Private Message to specific peer
 * @param {string} peer_id socket.id
 * @param {string} toPeerName peer name to send message
 */
function handlePeerPrivateMsg(peer_id, toPeerName) {
  let peerPrivateMsg = getId(peer_id + "_privateMsg");
  peerPrivateMsg.onclick = (e) => {
    e.preventDefault();
    sendPrivateMsgToPeer(myPeerId, toPeerName);
  };
}

/**
 * Send Private messages to peers
 * @param {string} toPeerId
 * @param {string} toPeerName
 */
function sendPrivateMsgToPeer(toPeerId, toPeerName) {
  Swal.fire({
    background: swalBackground,
    position: "center",
    imageUrl: messageImg,
    title: "Send private message",
    input: "text",
    showCancelButton: true,
    confirmButtonText: `Send`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.value) {
      let pMsg = checkMsg(result.value);
      if (!pMsg) {
        isChatPasteTxt = false;
        return;
      }
      emitMsg(myPeerName, toPeerName, pMsg, true, toPeerId);
      appendMessage(
        myPeerName,
        rightChatAvatar,
        "right",
        pMsg + "<br/><hr>Private message to " + toPeerName,
        true
      );
      userLog("toast", "Message sent to " + toPeerName + " 👍");
    }
  });
}


/**
 * Set Participant Video Status Icon and Title
 * @param {string} peer_id socket.id
 * @param {boolean} status of peer video
 */
function setPeerVideoStatus(peer_id, status) {
  let peerVideoAvatarImage = getId(peer_id + "_avatar");
  let peerVideoStatus = getId(peer_id + "_videoStatus");
  if (peerVideoAvatarImage)
    peerVideoAvatarImage.style.display = status ? "none" : "block";
  if (peerVideoStatus) {
    peerVideoStatus.className = className.videoOn + (status ? "" : "-slash");
    setTippy(
      peerVideoStatus,
      status ? "Participant video is on" : "Participant video is off",
      "bottom"
    );
    status ? playSound("on") : playSound("off");
  }
}

/**
 * Emit actions to all peers in the same room except yourself
 * @param {object} peerAction to all peers
 */
async function emitPeersAction(peerAction) {
  if (!thereIsPeerConnections()) return;

  sendToServer("peerAction", {
    room_id: roomId,
    peer_name: myPeerName,
    peer_id: myPeerId,
    peer_use_video: useVideo,
    peer_action: peerAction,
    send_to_all: true,
  });
}

/**
 * Emit actions to specified peer in the same room
 * @param {string} peer_id socket.id
 * @param {object} peerAction to specified peer
 */
async function emitPeerAction(peer_id, peerAction) {
  if (!thereIsPeerConnections()) return;

  sendToServer("peerAction", {
    room_id: roomId,
    peer_id: peer_id,
    peer_use_video: useVideo,
    peer_name: myPeerName,
    peer_action: peerAction,
    send_to_all: false,
  });
}

/**
 * Handle received peer actions
 * @param {object} config data
 */
function handlePeerAction(config) {
  let peer_id = config.peer_id;
  let peer_name = config.peer_name;
  let peer_use_video = config.peer_use_video;
  let peer_action = config.peer_action;

  switch (peer_action) {
    case "muteAudio":
      setMyAudioOff(peer_name);
      break;
    case "hideVideo":
      setMyVideoOff(peer_name);
      break;
    case "screenStart":
      handleScreenStart(peer_id);
      break;
    case "screenStop":
      handleScreenStop(peer_id, peer_use_video);
      break;
  }
}

/**
 * Handle Screen Start
 * @param {string} peer_id
 */
function handleScreenStart(peer_id) {
  let remoteVideoAvatarImage = getId(peer_id + "_avatar");
  let remoteVideoStatusBtn = getId(peer_id + "_videoStatus");
  let remoteVideoStream = getId(peer_id + "_video");
  if (remoteVideoStatusBtn) {
    remoteVideoStatusBtn.className = className.videoOn;
    setTippy(remoteVideoStatusBtn, "Participant screen share is on", "bottom");
  }
  if (remoteVideoStream) {
    getId(peer_id + "_pinUnpin").click();
    remoteVideoStream.style.objectFit = "contain";
    remoteVideoStream.style.name = peer_id + "_typeScreen";
  }
  if (remoteVideoAvatarImage) {
    remoteVideoAvatarImage.style.display = "none";
  }
}

/**
 * Handle Screen Stop
 * @param {string} peer_id
 * @param {boolean} peer_use_video
 */
function handleScreenStop(peer_id, peer_use_video) {
  let remoteVideoStream = getId(peer_id + "_video");
  let remoteVideoAvatarImage = getId(peer_id + "_avatar");
  let remoteVideoStatusBtn = getId(peer_id + "_videoStatus");
  if (remoteVideoStatusBtn) {
    remoteVideoStatusBtn.className = className.videoOff;
    setTippy(remoteVideoStatusBtn, "Participant screen share is off", "bottom");
  }
  if (remoteVideoStream) {
    if (isVideoPinned) getId(peer_id + "_pinUnpin").click();
    remoteVideoStream.style.objectFit = "var(--video-object-fit)";
    remoteVideoStream.style.name = peer_id + "_typeCam";
    adaptAspectRatio();
  }
  if (remoteVideoAvatarImage && remoteVideoStream && !peer_use_video) {
    remoteVideoAvatarImage.style.display = "block";
    remoteVideoStream.srcObject.getVideoTracks().forEach((track) => {
      track.enabled = false;
    });
  } else {
    if (remoteVideoAvatarImage) {
      remoteVideoAvatarImage.style.display = "none";
    }
  }
}
/**
 * Set my Audio off and Popup the peer name that performed this action
 * @param {string} peer_name peer name
 */
function setMyAudioOff(peer_name) {
  if (myAudioStatus === false || !useAudio) return;
  localMediaStream.getAudioTracks()[0].enabled = false;
  myAudioStatus = localMediaStream.getAudioTracks()[0].enabled;
  audioBtn.className = className.videoOff;
  setMyAudioStatus(myAudioStatus);
  userLog("toast", peer_name + " has disabled your audio");
  playSound("off");
}

/**
 * Set my Audio on and Popup the peer name that performed this action
 * @param {string} peer_name peer name
 */
function setMyAudioOn(peer_name) {
  if (myAudioStatus === true || !useAudio) return;
  localMediaStream.getAudioTracks()[0].enabled = true;
  myAudioStatus = localMediaStream.getAudioTracks()[0].enabled;
  audioBtn.className = className.audioOn;
  setMyAudioStatus(myAudioStatus);
  userLog("toast", peer_name + " has enabled your audio");
  playSound("on");
}

/**
 * Set my Video off and Popup the peer name that performed this action
 * @param {string} peer_name peer name
 */
function setMyVideoOff(peer_name) {
  if (myVideoStatus === false || !useVideo) return;
  localMediaStream.getVideoTracks()[0].enabled = false;
  myVideoStatus = localMediaStream.getVideoTracks()[0].enabled;
  videoBtn.className = className.videoOff;
  setMyVideoStatus(myVideoStatus);
  userLog("toast", peer_name + " has disabled your video");
  playSound("off");
}

/**
 * Mute or Hide everyone except yourself
 * @param {string} element type audio/video
 */
function disableAllPeers(element) {
  if (!thereIsPeerConnections()) {
    return userLog("info", "No participants detected");
  }
  Swal.fire({
    background: swalBackground,
    position: "center",
    imageUrl: element == "audio" ? audioOffImg : camOffImg,
    title:
      element == "audio"
        ? "Mute everyone except yourself?"
        : "Hide everyone except yourself?",
    text:
      element == "audio"
        ? "Once muted, you won't be able to unmute them, but they can unmute themselves at any time."
        : "Once hided, you won't be able to unhide them, but they can unhide themselves at any time.",
    showDenyButton: true,
    confirmButtonText: element == "audio" ? `Mute` : `Hide`,
    denyButtonText: `Cancel`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      switch (element) {
        case "audio":
          userLog("toast", "Mute everyone 👍");
          emitPeersAction("muteAudio");
          break;
        case "video":
          userLog("toast", "Hide everyone 👍");
          emitPeersAction("hideVideo");
          break;
      }
    }
  });
}

/**
 * Mute or Hide specific peer
 * @param {string} peer_id socket.id
 * @param {string} element type audio/video
 */
function disablePeer(peer_id, element) {
  if (!thereIsPeerConnections()) {
    return userLog("info", "No participants detected");
  }
  Swal.fire({
    background: swalBackground,
    position: "center",
    imageUrl: element == "audio" ? audioOffImg : camOffImg,
    title:
      element == "audio" ? "Mute this participant?" : "Hide this participant?",
    text:
      element == "audio"
        ? "Once muted, you won't be able to unmute them, but they can unmute themselves at any time."
        : "Once hided, you won't be able to unhide them, but they can unhide themselves at any time.",
    showDenyButton: true,
    confirmButtonText: element == "audio" ? `Mute` : `Hide`,
    denyButtonText: `Cancel`,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      switch (element) {
        case "audio":
          userLog("toast", "Mute audio 👍");
          emitPeerAction(peer_id, "muteAudio");
          break;
        case "video":
          userLog("toast", "Hide video 👍");
          emitPeerAction(peer_id, "hideVideo");
          break;
      }
    }
  });
}

/**
 * Handle Room action
 * @param {object} config data
 * @param {boolean} emit data to signaling server
 */
function handleRoomAction(config, emit = false) {
  if (emit) {
    let thisConfig = {
      room_id: roomId,
      peer_name: myPeerName,
      action: config.action,
      password: null,
    };
    switch (config.action) {
      case "lock":
        // playSound("newMessage");
        Swal.fire({
          allowOutsideClick: false,
          allowEscapeKey: false,
          showDenyButton: true,
          background: swalBackground,
          imageUrl: roomLockedImg,
          input: "text",
          inputPlaceholder: "Set Room password",
          confirmButtonText: `OK`,
          denyButtonText: `Cancel`,
          showClass: {
            popup: "animate__animated animate__fadeInDown",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp",
          },
          inputValidator: (pwd) => {
            if (!pwd) return "Please enter the Room password";
            thisRoomPassword = pwd;
          },
        }).then((result) => {
          if (result.isConfirmed) {
            thisConfig.password = thisRoomPassword;
            sendToServer("roomAction", thisConfig);
            handleRoomStatus(thisConfig);
          }
        });
        break;
      case "unlock":
        sendToServer("roomAction", thisConfig);
        handleRoomStatus(thisConfig);
        break;
    }
  } else {
    // data coming from signaling server
    handleRoomStatus(config);
  }
}
/**
 * Handle room status
 * @param {object} config data
 */
function handleRoomStatus(config) {
  let action = config.action;
  let peer_name = config.peer_name;
  switch (action) {
    case "lock":
      playSound("locked");
      userLog(
        "toast",
        peer_name + " has 🔒 LOCKED the room by password",
        "top-end"
      );
      elemDisplay(lockRoomBtn, false);
      elemDisplay(unlockRoomBtn, true);
      isRoomLocked = true;
      break;
    case "unlock":
      userLog("toast", peer_name + " has 🔓 UNLOCKED the room", "top-end");
      elemDisplay(unlockRoomBtn, false);
      elemDisplay(lockRoomBtn, true);
      isRoomLocked = false;
      break;
  }
}
/**
 * Set color to specific element
 * @param {object} elem element
 * @param {string} color to set
 */
function setColor(elem, color) {
  elem.style.color = color;
}

/**
 * Create File Sharing Data Channel
 * @param {string} peer_id socket.id
 */
function createFileSharingDataChannel(peer_id) {
  fileDataChannels[peer_id] = peerConnections[peer_id].createDataChannel(
    "videolify_file_sharing_channel"
  );
  fileDataChannels[peer_id].binaryType = "arraybuffer";
  fileDataChannels[peer_id].onopen = (event) => {
    console.log("fileDataChannels created", event);
  };
}

/**
 * Handle File Sharing
 * @param {object} data received
 */
function handleDataChannelFileSharing(data) {
  if (!receiveInProgress) return;
  receiveBuffer.push(data);
  receivedSize += data.byteLength;
  receiveProgress.value = receivedSize;
  receiveFilePercentage.innerHTML =
    "Receive progress: " +
    ((receivedSize / incomingFileInfo.file.fileSize) * 100).toFixed(2) +
    "%";
  if (receivedSize === incomingFileInfo.file.fileSize) {
    receiveFileDiv.style.display = "none";
    incomingFileData = receiveBuffer;
    receiveBuffer = [];
  }
}

/**
 * Send File Data trought datachannel
 * https://webrtc.github.io/samples/src/content/datachannel/filetransfer/
 * https://github.com/webrtc/samples/blob/gh-pages/src/content/datachannel/filetransfer/js/main.js
 *
 * @param {string} peer_id peer id
 * @param {boolean} broadcast sent to all or not
 */
function sendFileData(peer_id, broadcast) {
  console.log(
    "Send file " +
    fileToSend.name +
    " size " +
    bytesToSize(fileToSend.size) +
    " type " +
    fileToSend.type
  );

  sendInProgress = true;

  sendFileInfo.innerHTML =
    "File name: " +
    fileToSend.name +
    "<br>" +
    "File type: " +
    fileToSend.type +
    "<br>" +
    "File size: " +
    bytesToSize(fileToSend.size) +
    "<br>";

  sendFileDiv.style.display = "inline";
  sendProgress.max = fileToSend.size;
  fileReader = new FileReader();
  let offset = 0;

  fileReader.addEventListener("error", (err) =>
    console.error("fileReader error", err)
  );
  fileReader.addEventListener("abort", (e) =>
    console.log("fileReader aborted", e)
  );
  fileReader.addEventListener("load", (e) => {
    if (!sendInProgress) return;

    // peer to peer over DataChannels
    let data = {
      peer_id: peer_id,
      broadcast: broadcast,
      fileData: e.target.result,
    };
    sendFSData(data);
    offset += data.fileData.byteLength;

    sendProgress.value = offset;
    sendFilePercentage.innerHTML =
      "Send progress: " + ((offset / fileToSend.size) * 100).toFixed(2) + "%";

    // send file completed
    if (offset === fileToSend.size) {
      sendInProgress = false;
      sendFileDiv.style.display = "none";
      userLog(
        "success",
        "The file " + fileToSend.name + " was sent successfully."
      );
    }

    if (offset < fileToSend.size) readSlice(offset);
  });
  const readSlice = (o) => {
    const slice = fileToSend.slice(offset, o + chunkSize);
    fileReader.readAsArrayBuffer(slice);
  };
  readSlice(0);
}

/**
 * Send File through RTC Data Channels
 * @param {object} data to sent
 */
function sendFSData(data) {
  let broadcast = data.broadcast;
  let peer_id_to_send = data.peer_id;
  if (broadcast) {
    // send to all peers
    for (let peer_id in fileDataChannels) {
      if (fileDataChannels[peer_id].readyState === "open")
        fileDataChannels[peer_id].send(data.fileData);
    }
  } else {
    // send to peer
    for (let peer_id in fileDataChannels) {
      if (
        peer_id_to_send == peer_id &&
        fileDataChannels[peer_id].readyState === "open"
      ) {
        fileDataChannels[peer_id].send(data.fileData);
      }
    }
  }
}

/**
 * Abort the file transfer
 */
function abortFileTransfer() {
  if (fileReader && fileReader.readyState === 1) {
    fileReader.abort();
    sendFileDiv.style.display = "none";
    sendInProgress = false;
    sendToServer("fileAbort", {
      room_id: roomId,
      peer_name: myPeerName,
    });
  }
}

/**
 * Hide incoming file transfer
 */
function hideFileTransfer() {
  receiveFileDiv.style.display = "none";
}

/**
 * Html Json pretty print
 * @param {object} obj
 * @returns html pre json
 */
function toHtmlJson(obj) {
  return "<pre>" + JSON.stringify(obj, null, 4) + "</pre>";
}

/**
 * Videochat about info
 */
function showAbout() {
  // playSound("newMessage");
  Swal.fire({
    background: swalBackground,
    position: "center",
    title: "<strong>Videochat.uz</strong>",
    imageAlt: "About",
    imageUrl: aboutImg,
    html: `
        <br/>
        <p style="color: #fff; font-size: 18px; text-align: center;">
        <strong>Videochat.uz</strong> - is a free video chat service that allows you to communicate with friends, family and strangers through a webcam and microphone.
        </p>
        `,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  });
}

/**
 * Leave the Room and create a new one
 */
function leaveRoom() {
  // playSound("eject");
  openURL("/");
}
function nextPeer(ftype) {
  let typeOfCall = ftype || "button";
  sendToServer("nextPeer", {
    peer_id: myPeerId,
    room_id: roomId,
    last5peers: last5peers(),
    typeOfCall: typeOfCall,
  });
}
function dragElement(elmnt, dragObj) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (dragObj) {
    dragObj.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }
  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function getDataTimeString() {
  const d = new Date();
  const date = d.toISOString().split("T")[0];
  const time = d.toTimeString().split(" ")[0];
  return `${date}-${time}`;
}
function bytesToSize(bytes) {
  let sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}
function handlePeerVolume(data) {
  let peer_id = data.peer_id;
  let element = getId(peer_id + "_pitch_bar");
  let remoteVideoWrap = getId(peer_id + "_videoWrap");
  let volume = data.volume + 25; //for design purpose
  if (!element) return;
  if (volume > 50) {
    element.style.backgroundColor = "orange";
  }
  element.style.height = volume + "%";
  remoteVideoWrap.classList.toggle("speaking");
  setTimeout(function () {
    element.style.backgroundColor = "#19bb5c";
    element.style.height = "0%";
    remoteVideoWrap.classList.toggle("speaking");
  }, 700);
}

/**
 * Handle my audio volume
 * @param {object} data my audio
 */
function handleMyVolume(data) {
  let element = getId("myPitchBar");
  let volume = data.volume + 25;
  if (!element) return;
  if (volume > 50) {
    element.style.backgroundColor = "orange";
  }
  element.style.height = volume + "%";
  myVideoWrap.classList.toggle("speaking");
  setTimeout(function () {
    element.style.backgroundColor = "#19bb5c";
    element.style.height = "0%";
    myVideoWrap.classList.toggle("speaking");
  }, 700);
}
function userLog(type, message, timer = 3000) {
  switch (type) {
    case "warning":
    case "error":
      Swal.fire({
        background: swalBackground,
        position: "center",
        icon: type,
        title: type,
        text: message,
      });
      playSound("alert");
      break;
    case "info":
    case "success":
      Swal.fire({
        background: swalBackground,
        position: "center",
        icon: type,
        title: type,
        text: message,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      break;
    case "success-html":
      Swal.fire({
        background: swalBackground,
        position: "center",
        icon: "success",
        title: "Success",
        html: message,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      break;
    case "toast":
      const Toast = Swal.mixin({
        background: swalBackground,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: "info",
        title: message,
      });
      break;
    default:
      alert(message);
  }
}
function msgPopup(icon, message, position, timer = 1000) {
  const Toast = Swal.mixin({
    background: swalBackground,
    toast: true,
    position: position,
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
  });
  Toast.fire({
    icon: icon,
    title: message,
  });
}
async function playSound(name) {
  if (!notifyBySound) return;
  let sound = "../sounds/" + name + ".mp3";
  let audioToPlay = new Audio(sound);
  try {
    audioToPlay.volume = 0.5;
    await audioToPlay.play();
  } catch (err) {
    return;
  }
}
function openURL(url, blank = false) {
  blank ? window.open(url, "_blank") : (window.location.href = url);
}
function toggleClassElements(className, displayState) {
  let elements = getEcN(className);
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = displayState;
  }
}
function isTablet(userAgent) {
  return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
    userAgent
  );
}
function isIpad(userAgent) {
  return /macintosh/.test(userAgent) && "ontouchend" in document;
}
function getId(id) {
  return document.getElementById(id);
}
function getSl(selector) {
  return document.querySelector(selector);
}

function getEcN(className) {
  return document.getElementsByClassName(className);
}
function getName(name) {
  return document.getElementsByName(name);
}
function elemDisplay(elem, yes) {
  elem.style.display = yes ? "inline" : "none";
}
function changeMyName(newName){
  let myNewPeerName = newName;
  let myOldPeerName = myPeerName;

  // myNewPeerName empty
  if (!myNewPeerName) return;

  myPeerName = myNewPeerName;
  myVideoParagraph.innerHTML =
    (myPeerName || window.localStorage.getItem("peer_name"));

  sendToServer("peerName", {
    room_id: roomId,
    peer_name_old: myOldPeerName,
    peer_name_new: myPeerName,
  });


  window.localStorage.peer_name = myPeerName;

  setPeerAvatarImgName("myVideoAvatarImage", useAvatarApi);
  setPeerChatAvatarImgName("right", myPeerName);
}

function updateMyName(){
	const myName = document.getElementById("myVideoParagraph");
	myName.addEventListener("click",async (e)=>{
        e.stopPropagation();

	const result = await swal.fire({
                title:"Ismingizni kiriting",
        	background:"transparent",
		color:"#000",
                inputAutoFocus:true,
                showCancelButton:true,
	        input:"text",
	});

	if(result.value){
         const newUsername = result.value;
	 changeMyName(newUsername);
       	}
     })
}

function logger(msg, log) {
  signalingSocket.emit("log", {
    msg: msg,
    log: log
  })
}
