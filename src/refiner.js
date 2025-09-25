/*
need to:
- ??

*/

export function refineUrl(path) {
  return path;
}

export function refineResponse(response) {
  // get rid of foreign domains
  return response.replaceAll(/http(s)?:\/\/[a-zA-Z0-9-.]+/g, "");
}