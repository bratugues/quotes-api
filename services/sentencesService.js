import fs, { readFileSync } from 'fs'

const FILE_PATH = './data/sentences.json'

export function loadSentences() {
  return JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'))
}

export function writeSentences(sentences) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(sentences, null, 2))
}

export const detectLanguage = (sentence) => {
      if(/[\u4e00-\u9fff]/.test(sentence)){
        return 'zh'
    } else if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(sentence)){
      return 'pt'
    } else {
      return 'en'
    }
  }
