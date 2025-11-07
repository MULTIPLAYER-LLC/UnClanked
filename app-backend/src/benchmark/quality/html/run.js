import { valid } from 'node-html-parser';

export async function evaluateHTML(url) {
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

export async function evaluateTXT(url) {
  const http = await fetch(url, {
    headers: { 'Accept': 'text/plain' }
  });
  if(http.status !== 200) {
    throw new Error("failed to fetch page");
  }
  return await http.text();
}

export async function evaluateAPI(method, url, body) {
  const http = await fetch(url, {
    method,
    body,
    headers: { 'Accept': 'application/json' }
  });
  if(http.status !== 200) {
    throw new Error("failed to fetch page");
  }
  return await http.text();
}

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
  return `${mean} (${list.sort((a, b) => parseInt(a) - parseInt(b))})`;
}


function isHtml(text) {
  return text?.length > 20 && valid(text);
}
function contentSize(text) {
  return text.length;
}
function numImages(text) {
  return text.match(/(<img )|(url\(['"].+?['"]\))/g)?.length || 0;
}
function numCSS(text) {
  const styleBlocks = text.match(/<style>.*?<\/style>/gs);
  const blockLineCount = styleBlocks?.map(block => (block.match(/:/gs)?.length || 0)).reduce((a, b) => a+b) || 0;
  const inlineCount = text.match(/ style=/g)?.length || 0;
  return blockLineCount + inlineCount;
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

// html

// const allResults = [];
// for(let i = 0; i < 50; i++) {
//   console.log(`run ${i+1}`);
//   allResults.push(await evaluateHTML("http://127.0.0.1:3005/articles/top-5-superfoods"));
// }
// console.log(reduceResults(allResults));

// txt

// for(let i = 0; i < 50; i++) {
//   console.log(`run ${i+1}`);
//   await evaluateTXT("http://127.0.0.1:3005/~/.ssh/config");
// }

// api

// for(let i = 0; i < 50; i++) {
//   console.log(`run ${i+1}`);
//   await evaluateAPI('POST', "http://127.0.0.1:3005/calls_index/_search", JSON.stringify({
//     "size": 5,
//     "query": {
//       "match": {
//         "call_type": "spam"
//       }
//     }
//   }));
// }

