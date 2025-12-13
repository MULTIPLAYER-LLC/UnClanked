import he from 'he';

export function refineResponse(req, response) {
  // get rid of foreign domains
  return he.decode(
    response
      ?.replaceAll(/http(s)?:\/\/[a-zA-Z0-9-.]+/g, "")
      ?.replace("<head>", `<head><link rel=\"icon\" type=\"image/x-icon\" href=\"${req.url}.ico\">`)
  );
}