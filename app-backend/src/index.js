import http from 'http';
import { generate } from '#src/generator.js';
import { refineResponse } from '#src/refiner.js';

const port = process.env.API_PORT || 3000;
const image_server = process.env.IMAGE_HOST || 'http://192.168.1.22:7860';

const getBody = req => new Promise((resolve, reject) => {
  let data = "";
  req.on("data", chunk => (data += chunk));
  req.on("end", () => resolve(data));
  req.on("error", reject);
});

const common_headers = {
  'Access-Control-Allow-Origin': "*",
  'Access-Control-Allow-Headers': "*",
  'Access-Control-Allow-Methods': "HEAD, GET, POST, PUT, DELETE, PATCH, OPTIONS, TRACE, CONNECT",
  'Transfer-Encoding': 'chunked',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
}

http.createServer(async (req, res) => {
  const path = req.url;
  const structuredUrl = new URL(req.url, `http://${req.headers.host}`);
  const splitpath = structuredUrl.pathname.split(".");
  const extension = splitpath.at(-1);

  // if we want to entirely handle this route manually, do so
  if(/(png)|(jpg)|(jpeg)|(ico)|(gif)|(tiff)|(svg)|(webp)|(avif)|(img)$/.test(extension)) {
    const image_name = splitpath.slice(0, -1).join("-").split("/").at(-1);
    const image_remote_path = `${image_server}/${image_name}`;
    console.log(`requested '${image_name}', fetching from '${image_remote_path}'`);
    const generated_image = await (await fetch(image_remote_path)).arrayBuffer();
    res.writeHead(200, { 
      ...common_headers,
      "Content-Type": 'image/png',
      "Content-Length": generated_image.byteLength
    });
    res.end(Buffer.from(generated_image));
    return;
  }

  const method = req.method || "GET";
  let accept = (req.headers["accept"] || "*/*").split(",")[0];
  let forcedContentType = null;
  let custom = "";
  const body = await getBody(req);

  if(splitpath.length > 1 && !extension.includes("/")) {
    accept = `text/${extension}`;
    // forcedContentType = 'text/plain';
  }

  console.log("\n\n\n");
  console.log(`input method: '${method}'`);
  console.log(`input accepts: '${accept}'`);
  console.log(`input path: '${path}'`);
  console.log(`input body: '${body}'`);

  if(accept === 'text/html') {
    custom = "always add og:title, og:description, and css styling to your html response. Include png images with detailed names when possible.";
  }

  const response = (await generate({ method, path, body, accept, custom })).response;
  
  const filteredResponse = refineResponse(response);
  const responseCode = filteredResponse.match(/<response-code>(.*?)<\/response-code>/s)?.[1]?.trim() || 200;
  const contentType = forcedContentType || filteredResponse.match(/<content-type>(.*?)<\/content-type>/s)?.[1]?.trim() || "text/plain";
  const responseBody = filteredResponse.match(/<response-body>(.*?)<\/response(-body)?>/s)?.[1]?.trim() || "";

  console.log();
  console.log(`output code: '${responseCode}'`);
  console.log(`output type: '${contentType}'`);
  console.log(`output body: '${responseBody}'`);

  res.writeHead(responseCode, { 
    ...common_headers,
    "Content-Type": contentType
  });
  res.end(responseBody + "\n");
}).listen(port, () => {
  console.log(`started on 127.0.0.1:${port}`);
});



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