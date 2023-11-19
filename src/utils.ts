export function createPath(str: string) {
  if (str[0] !== "/") {
    return "/" + str;
  }
  return str;
}
export const representationHeaders = [
  "Content-Type",
  "Content-Encoding",
  "Content-Language",
  "Content-Location",
];

export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  PATCH = "patch",
  OPTIONS = "options",
  HEAD = "head",
  ALL = "all",
}

