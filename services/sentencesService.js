import fs, { readFileSync } from 'fs'

const FILE_PATH = './data/sentences.json'

export function loadSentences() {
  return JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'))
}

export function writeSentences(sentences) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(sentences, null, 2))
}
