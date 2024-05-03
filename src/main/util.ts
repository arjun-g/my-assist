/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import { randomBytes } from 'crypto';

export function resolveHtmlPath(path: string = '/') {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}#${path}`);
    url.pathname = 'index.html';
    return url.href;
  }
  return `file://${path.resolve(
    __dirname,
    '../renderer/',
    `index.html#${path}`,
  )}`;
}

export function randomString(length: number) {
  return randomBytes(length).toString('hex');
}
