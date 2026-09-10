import { customAlphabet } from 'nanoid';
import { db } from '../db/init.js';

// Unambiguous alphabet: no 0/O, 1/l/I confusion
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const length = Number(process.env.SHORT_CODE_LENGTH || 7);
const generate = customAlphabet(alphabet, length);

const existsStmt = db.prepare('SELECT 1 FROM links WHERE short_code = ?');

export function generateUniqueShortCode() {
  let code;
  let attempts = 0;
  do {
    code = generate();
    attempts += 1;
    if (attempts > 10) {
      throw new Error('Could not generate a unique short code, try again');
    }
  } while (existsStmt.get(code));
  return code;
}

export function isValidCustomCode(code) {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
}
