import he from 'he';

export function refineResponse(response) {
  // get rid of foreign domains
  return he.decode(response.replaceAll(/http(s)?:\/\/[a-zA-Z0-9-.]+/g, ""));
}