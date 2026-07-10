import { echangeToken } from '../_lib/malProxy.js';

export default async function handler(req, res) {
  return echangeToken(req, res);
}
