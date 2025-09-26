import he from 'he';

export function refineUrl(path) {
  return path;
}

export function refineResponse(response) {
  // get rid of foreign domains
  return he.decode(response.replaceAll(/http(s)?:\/\/[a-zA-Z0-9-.]+/g, ""));
}