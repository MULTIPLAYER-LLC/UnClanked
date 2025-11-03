import { valid } from 'node-html-parser';

function log(text) {
  console.log(`isHtml: ${isHtml(text)}`);
  console.log(`contentSize: ${contentSize(text)}`);
  console.log(`numImages: ${numImages(text)}`);
  console.log(`numCSS: ${numCSS(text)}`);
  console.log(`numCSSImports: ${numCSSImports(text)}`);
  console.log(`numJS: ${numJS(text)}`);
  console.log(`numJSImports: ${numJSImports(text)}`);
  console.log(`numComments: ${numComments(text)}`);
  console.log(`hasTitle: ${hasTitle(text)}`);
  console.log(`hasOGMetaTitle: ${hasOGMetaTitle(text)}`);
  console.log(`hasOGMetaDescription: ${hasOGMetaDescription(text)}`);
  console.log(`hasOGMetaImage: ${hasOGMetaImage(text)}`);
}

export async function evaluateURL(url) {
  const http = await fetch(url, {
    headers: { 'Accept': 'text/html' }
  });
  if(http.status !== 200) {
    throw new Error("failed to fetch page");
  }
  const body = await http.text();
  const results = evaluateText(body);
  return results;
}

const allResults = [];
for(let i = 0; i < 50; i++) {
  console.log(`run ${i+1}`);
  allResults.push(await evaluateURL("http://127.0.0.1:3005/articles/top-5-superfoods"));
}
console.log(reduceResults(allResults));

export function evaluateText(text) {
  return {
    isHtml: isHtml(text),
    contentSize: contentSize(text),
    numImages: numImages(text),
    numCSS: numCSS(text),
    numCSSImports: numCSSImports(text),
    numJS: numJS(text),
    numJSImports: numJSImports(text),
    numComments: numComments(text),
    hasTitle: hasTitle(text),
    hasOGMetaTitle: hasOGMetaTitle(text),
    hasOGMetaDescription: hasOGMetaDescription(text),
    hasOGMetaImage: hasOGMetaImage(text)
  }
}

export function reduceResults(resultsList) {
  return {
    isHtml: booleanStats(resultsList.map(e => e.isHtml)),
    contentSize: numberStats(resultsList.map(e => e.contentSize)),
    numImages: numberStats(resultsList.map(e => e.numImages)),
    numCSS: numberStats(resultsList.map(e => e.numCSS)),
    numCSSImports: numberStats(resultsList.map(e => e.numCSSImports)),
    numJS: numberStats(resultsList.map(e => e.numJS)),
    numJSImports: numberStats(resultsList.map(e => e.numJSImports)),
    numComments: numberStats(resultsList.map(e => e.numComments)),
    hasTitle: booleanStats(resultsList.map(e => e.hasTitle)),
    hasOGMetaTitle: booleanStats(resultsList.map(e => e.hasOGMetaTitle)),
    hasOGMetaDescription: booleanStats(resultsList.map(e => e.hasOGMetaDescription)),
    hasOGMetaImage: booleanStats(resultsList.map(e => e.hasOGMetaImage))
  }
}

function booleanStats(list) {
  const trues = list.filter(e => e);
  return (trues.length/(list.length) * 100).toFixed(0) + "%";
}
function numberStats(list) {
  const sum = list.reduce((a,b) => a+b);
  const mean = sum / list.length;
  return `${mean} (${list.sort()})`;
}


function isHtml(text) {
  return text?.includes("<html") && valid(text);
}
function contentSize(text) {
  return text.length;
}
function numImages(text) {
  return text.match(/(<img )|(url\(['"].+?['"]\))/g)?.length || 0;
}
function numCSS(text) {
  const styleBlocks = text.match(/<style>.*?<\/style>/gs);
  return styleBlocks?.map(block => (block.match(/:/gs)?.length || 0)).reduce((a, b) => a+b) || 0;
}
function numCSSImports(text) {
  return text.match(/rel="stylesheet"/g)?.length || 0;
}
function numJS(text) {
  const jsBlocks = text.match(/<script>.*?<\/script>/gs);
  return jsBlocks?.map(block => (block.split("\n").filter(l => l.trim().length > 4 && !l.trim().match(/script>$/))?.length || 0)).reduce((a, b) => a+b) || 0;
}
function numJSImports(text) {
  return text.match(/<script .*?src=.+?.*?><\/script>/g)?.filter(e => !e.includes("cloudflareinsights.com"))?.length || 0;
}
function numComments(text) {
  return text.match(/<!--.*?-->/gs)?.length || 0;
}
function hasTitle(text) {
  return !!text?.match(/<title/);
}
function hasOGMetaTitle(text) {
  return !!text?.match(/name=['"]og:title['"]/);
}
function hasOGMetaDescription(text) {
  return !!text?.match(/name=['"]og:description['"]/);
}
function hasOGMetaImage(text) {
  return !!text?.match(/name=['"]og:image['"]/);
}

// console.log(evaluate(`<!DOCTYPE html>
// <html lang="en">
// <!-- Meta tags -->
// <!-- and other stuff -->
// <!--
// multiline mmmm
// -->
// <head>
//     <meta charset="UTF-8">
//     <title>Apples - Home</title>
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <meta name="description" content="Explore the delicious world of apples. Enjoy fresh, ripe, and perfect apple experiences.">
//     <meta name="og:title" content="Apples - Home">
//     <meta name="og:description" content="Explore the delicious world of apples. Enjoy fresh, ripe, and perfect apple experiences.">
//     <meta name="og:image" content="/600x400?text=Apples+and+Apple+Pie">
//     <link rel="stylesheet" href="styles.css">
//     <link rel="stylesheet" href="styles2.css">
//     <style>
//         body {
//             font-family: sans-serif;
//             margin: 0;
//             padding: 0;
//             background-color: #f9f9f9;
//         }
//         h1 {
//             color: #2c3eb9;
//         }
//         .container {
//             max-width: 800px;
//             margin: 30px auto;
//             padding: 20px;
//             background-color: white;
//             border-radius: 8px;
//             box-shadow: 0 0 10px rgba(0,0,0,0.2);
//         }
//         .photo-container {
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             height: 100vh;
//             background-image: url("/wikipedia/commons/6/6e/Apple_1024x768.jpg");
//             background-size: cover;
//             background-repeat: no-repeat;
//             background-position: center;
//         }
//         button {
//             padding: 10px 20px;
//             margin-top: 20px;
//             border: none;
//             cursor: pointer;
//             font-size: 16px;
//         }
//         button:hover {
//             background-color: #3498db;
//         }
//     </style>
//     <script>
//       console.log("hello world!");
//       const i = 0;
//       const e = 2;
//       if(a == 1) { 
//         console.log("meh");
//       }
//     </script>
// </head>
// <body>
//     <div class="container">
//         <h1>Welcome to Apples!</h1>
//         <p>Enjoy the sweet taste of apples.</p>
//         <button onclick="location.href='#';">Buy Apples</button>
//         <button onclick="alert('Thank you for buying apples!');">Buy Apple Pie</button>
//     </div>
//     <div class="photo">
//         <img src="/apple.jpg" alt="Apple photo" />
//     </div>
//     <div class="photo">
//         <img src="/apple2.jpg" alt="Another apple photo" />
//     </div>
//     <script src="hi"></script>
// <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"version":"2024.11.0","token":"3243fd68b02b47dcbd33ae2bea67e0ae","r":1,"server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}' crossorigin="anonymous"></script>
// </body>
// </html>`));
