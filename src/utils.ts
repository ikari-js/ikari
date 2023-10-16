export function createPath(str: string) {
  if (str[0] !== "/") {
    return "/" + str;
  }
  return str;
}
