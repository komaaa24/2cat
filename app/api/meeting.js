const fetch = require("node-fetch");

const API_KEY = "videochat_default_secret";
 const VIDEOCHAT_URL = "http://localhost:3000/api/v1/meeting";
// const VIDEOCHAT_URL = "/api/v1/meeting";

function getResponse() {
  return fetch(VIDEOCHAT_URL, {
    method: "POST",
    headers: {
      authorization: API_KEY,
      "Content-Type": "application/json",
    },
  });
}

getResponse().then(async (res) => {
  console.log("Status code:", res.status);
  const data = await res.json();
  console.log("meeting:", data.meeting);
});
