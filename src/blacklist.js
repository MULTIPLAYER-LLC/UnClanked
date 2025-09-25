/*
handle exceptional paths
*/

export function blacklisted(path) {
  if(path === '/favicon.ico') {
    return " ";
  }
  return false;
}