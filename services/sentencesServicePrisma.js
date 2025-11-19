import { prisma } from '../prismaClient.js'
import { detectLanguage } from '../utils/detectLanguage.js'

export const getAllSentences = async () => {
  return await prisma.sentence.findMany()
}
export const createSentence = async (sentence) => {
  return await prisma.sentence.create({
        data:{
          text: sentence
        }
      })
}
export const updateSentence = async (id, newSentence) => {
  return await prisma.sentence.update({
        where: {
          id: id
        },
        data: {
          text: newSentence
        }
      })
}
export const deleteSentence = async (id) => {
  return await prisma.sentence.delete({
        where: {
          id: id
        }
      })
}
export const searchSentences = async (text) => {
  return await prisma.sentence.findMany({where: {text: {contains: text}}})
}
export const getRandomSentences = async (count) => {
      const sentences = await prisma.sentence.findMany()
      if (sentences.length === 0){
        return []
      } else if (sentences.length < count) {
        const err = new Error(`Count must be between 1 and ${sentences.length}`)
        err.statusCode = 400
        throw err
      }

      const shuffled = [...sentences].sort(() => Math.random() - 0.5)
      const selectedSentences = shuffled.slice(0, count)
      return selectedSentences
}
export const getRandomSentenceByLang = async (lang) => {
  const sentences = await prisma.sentence.findMany()

  const filtered = sentences.filter((sentence) => {
      return detectLanguage(sentence.text) === lang
  })

    if(filtered.length === 0) {
      const err = new Error("No sentences found for this language.")
      err.statusCode = 404
      throw err
    }

    const randomIndex = Math.floor(Math.random() * filtered.length)
    const selectedSentence = filtered[randomIndex]
    return {sentence: selectedSentence, total: filtered.length}
}
