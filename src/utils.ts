export function createPath(str: string) {
  if (str && str[0] !== "/") {
    return "/" + str;
  }
  return str;
}

