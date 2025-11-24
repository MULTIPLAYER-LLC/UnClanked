import http from 'http';
import { generate_api, generate_txt, generate_html } from '#src/generator-openai.js';
import { refineResponse } from '#src/refiner.js';

const port = process.env.API_PORT || 3005;
const image_server = process.env.IMAGE_HOST || 'http://192.168.1.22:7860';

const common_headers = {
  'Access-Control-Allow-Origin': "*",
  'Access-Control-Allow-Headers': "*",
  'Access-Control-Allow-Methods': "HEAD, GET, POST, PUT, DELETE, PATCH, OPTIONS, TRACE, CONNECT",
  'Transfer-Encoding': 'chunked',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
}

const getBody = req => new Promise((resolve, reject) => {
  let data = "";
  req.on("data", chunk => (data += chunk));
  req.on("end", () => resolve(data));
  req.on("error", reject);
});

const handleAsImage = async (res, image_path) => {
  try {
    const generated_image = await (await fetch(image_path)).arrayBuffer();
    res.writeHead(200, { 
      ...common_headers,
      "Content-Type": 'image/png',
    });
    res.end(Buffer.from(generated_image));
  } catch(e) {
    console.log(`failed image request: '${e.message}'`);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
  return;
};

function blacklist(req, res) {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;
  if(path === "/favicon.ico") {
    const referrer = req.headers["referer"];
    const structuredUrl = new URL(referrer, `http://${req.headers.host}`);
    const splitpath = structuredUrl.pathname.split(".");
    let image_name = splitpath.slice(0, -1).join("-").split("/").at(-1);
    const image_remote_path = `${image_server}/${image_name}-logo`;
    console.log(`requested '${path}', fetching from '${image_remote_path}'`);
    handleAsImage(res, image_remote_path);
    return true;
  }
  if(path === "/robots.txt") {
    res.writeHead(200, { 
      ...common_headers,
      "Content-Type": "text/plain"
    });
    res.end("User-agent: *\nAllow: /\n");
    return true;
  }
  return false;
}

// returns 'html', 'txt', 'api', 'img'
function route_to(req) {
  const structuredUrl = new URL(req.url, `http://${req.headers.host}`);
  const splitpath = structuredUrl.pathname.split(".");
  let extension = splitpath.at(-1);
  if(extension.length > 4) { extension = ""; }
  const method = req.method || "GET";
  let accept = (req.headers["accept"] || "*/*").split(",")[0];

  if(method !== "GET") { return 'api'; }
  if(accept.match(/^application\//)) { return 'api'; }
  if(accept.match(/^image\//)) { return 'img'; }
  if(extension.match(/^(png)|(jpg)|(jpeg)|(ico)|(gif)|(tiff)|(svg)|(webp)|(avif)|(img)/)) { return 'img'; }
  if(extension.match(/^(html)|(php)/)) { return 'html'; }
  if(extension.match(/^(json)/)) { return 'api'; }
  if(extension.match(/^[a-z0-9]{1,4}$/)) { return 'txt'; }
  if(structuredUrl.pathname.match(/^\/api(\/.+)?$/)) { return 'api'; }
  if(accept.match(/^text\/plain/)) { return 'txt'; }
  if(accept.match(/^text\/html/)) { return 'html'; }
  if(extension === '' || extension.match(/^(html)|(php)/)) { return 'html'; }
  return 'txt';
}

http.createServer(async (req, res) => {
  if(blacklist(req, res)) { return; }

  const path = req.url;
  const structuredUrl = new URL(req.url, `http://${req.headers.host}`);
  const splitpath = structuredUrl.pathname.split(".");
  const route_type = route_to(req);
  console.log(`${req.method} '${req.url}' - evaluating as '${route_type}'`);

  if(route_type === 'img') {
    const image_name = splitpath.slice(0, -1).join("-").split("/").at(-1);
    const image_remote_path = `${image_server}/${image_name}`;
    console.log(`requested '${path}', fetching from '${image_remote_path}'`);
    handleAsImage(res, image_remote_path);
    return;
  }
  if(route_type === 'html') {
    await handle_html(req, res);
    return;
  }
  if(route_type === 'txt') {
    await handle_txt(req, res);
    return;
  }
  if(route_type === 'api') {
    await handle_api(req, res);
    return;
  }
  res.writeHead(500, {
    ...common_headers,
    "Content-Type": "text/plain"
  });
  res.end("womp womp");
}).listen(port, () => {
  console.log(`started on 127.0.0.1:${port}`);
});

async function handle_txt(req, res) {
  res.writeHead(200, { 
    ...common_headers,
    "Content-Type": "text/plain"
  });

  let response;
  try {
    response = await generate_txt({ path: req.url });
  } catch(e) {
    res.writeHead(500, {
      ...common_headers,
      "Content-Type": "text/plain"
    });
    res.end("womp womp");
    return;
  }

  const filteredResponse = refineResponse(response);
  const responseBody = filteredResponse.match(/(.*?)<\/contents>/s)?.[1]?.trim() || "no dice...";
  res.end(responseBody + "\n");
}

async function handle_html(req, res) {

  res.writeHead(200, { 
    ...common_headers,
    "Content-Type": "text/html"
  });
  res.write("<!DOCTYPE html>\n");

  let response;
  try {
    response = await generate_html({ path: req.url });
  } catch(e) {
    res.writeHead(500, {
      ...common_headers,
      "Content-Type": "text/plain"
    });
    res.end("womp womp");
    return;
  }

  const filteredResponse = refineResponse(response);
  const responseBody = filteredResponse.match(/(.*?)<\/response>/s)?.[1]?.trim() || "no dice...";

  res.end(responseBody + "\n");
}

async function handle_api(req, res) {
  const path = req.url;
  const structuredUrl = new URL(req.url, `http://${req.headers.host}`);
  const splitpath = structuredUrl.pathname.split(".");
  let extension = splitpath.at(-1);
  if(extension.length > 4) { extension = ""; }
  const method = req.method || "GET";
  let accept = (req.headers["accept"] || "*/*").split(",")[0];
  let forcedContentType = null;
  const body = await getBody(req);

  if(splitpath.length > 1 && !extension.includes("/")) {
    accept = `text/${extension}`;
  } else if(accept.match(/text\/html/)) {
    accept = 'application/json';
  }
  
  let response;
  try {
    response = await generate_api({ method, path, body, accept });
  } catch(e) {
    res.writeHead(500, {
      ...common_headers,
      "Content-Type": "text/plain"
    });
    res.end("womp womp");
    return;
  }
  
  const filteredResponse = refineResponse(response);
  const responseCode = filteredResponse.match(/<response-code>(.*?)<\/response-code>/s)?.[1]?.trim() || 200;
  const contentType = forcedContentType || filteredResponse.match(/<content-type>(.*?)<\/content-type>/s)?.[1]?.trim() || "text/plain";
  const responseBody = filteredResponse.match(/<response-body>(.*?)<\/response(-body)?>/s)?.[1]?.trim() || "";

  // console.log();
  // console.log(`output code: '${responseCode}'`);
  // console.log(`output type: '${contentType}'`);
  // console.log(`output body: '${responseBody}'`);
  // if(!responseBody) {
  //   console.log(`raw output: '${response}'`);
  // }

  res.writeHead(responseCode, { 
    ...common_headers,
    "Content-Type": contentType
  });
  res.end(responseBody + "\n");
}

// const server = http.createServer(async (req, res) => {
//   res.writeHead(200, {
//     "Content-Type": "text/html; charset=utf-8",
//     "Transfer-Encoding": "chunked", // ensure streaming
//   });

//   const chunks = [
//     "<!DOCTYPE html><html><head><title>Slow Page</title></head><body>",
//     "<h1>Dripfeed Demo</h1>",
//     "<p>Loading content...</p>",
//     "<p>More text arriving...</p>",
//     "<p>Even more...</p>",
//     "<p>Done!</p>",
//     "</body></html>",
//   ];

//   let i = 0;

//   const interval = setInterval(() => {
//     if (i < chunks.length) {
//       console.log('write...', i);
//       res.write(chunks[i]);
//       i++;
//     } else {
//       clearInterval(interval);
//       res.end(); // finish the response
//     }
//   }, 1000); // drip out a chunk every 1 second
// });

// server.listen(port, () => {
//   console.log("Server running at http://localhost:3000/");
// });