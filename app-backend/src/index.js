import http from 'http';
import { generate } from '#src/generator.js';
import { refineUrl, refineResponse } from '#src/refiner.js';
import { blacklisted } from '#src/blacklist.js';

const port = process.env.API_PORT || 3000;

http.createServer(async (req, res) => {

  // if we want to entirely handle this route manually, do so
  const exception = blacklisted(req.url);
  if(exception) {
    res.writeHead(200);
    res.end(exception);
    return;
  }

  const method = req.method || "GET";
  let accept = (req.headers["accept"] || "*/*").split(",")[0];
  let forcedContentType = null;
  let custom = "";
  const path = refineUrl(req.url);
  const body = req.body || ""; // TODO fix!

  const structuredUrl = new URL(req.url, `http://${req.headers.host}`);
  const splitpath = structuredUrl.pathname.split(".");
  const extension = splitpath.at(-1);
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
    custom = "always add og:title, og:description, css styling to your html response.";
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
    "Content-Type": contentType,
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Headers': "*",
    'Access-Control-Allow-Methods': "HEAD, GET, POST, PUT, DELETE, PATCH, OPTIONS, TRACE, CONNECT",
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
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