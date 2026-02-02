import fs from 'fs';
import path from 'path';
import os from 'os';

export default function globalTeardown() {
  const pathFile = path.join(os.tmpdir(), 'alphabet-e2e-db-path.txt');
  try {
    const dbPath = fs.readFileSync(pathFile, 'utf8').trim();
    fs.unlinkSync(dbPath);
    fs.unlinkSync(dbPath + '-shm');
    fs.unlinkSync(dbPath + '-wal');
  } catch {
    // ignore
  }
  try {
    fs.unlinkSync(pathFile);
  } catch {
    // ignore
  }
}
