const xhr = new XMLHttpRequest();
let videoUrl;
// let video =
xhr.open("GET", "http://localhost:3000/video");
xhr.send();
xhr.responseType = "json";
xhr.onload = () => {
  if (xhr.readyState == 4 && xhr.status == 200) {
    const data = xhr.response;

    // video.src = data.path;
    console.log(data.path);
    // video.play();
  } else {
    console.log(`Error: ${xhr.status}`);
  }
};
