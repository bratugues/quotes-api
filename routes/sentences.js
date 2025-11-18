import express from 'express'
import { z } from 'zod'
import { loadSentences, writeSentences } from '../services/sentencesService.js'
import { prisma } from '../prismaClient.js'

export const router = express.Router()


let sentences = loadSentences()

router.get('/quote', async (req, res) => {
  const randomIndex = Math.floor(Math.random() * sentences.length)

  const randomQuote = sentences[randomIndex]

  res.json({sentence: randomQuote})
})

router.get('/all', async (req, res, next) => {
  const all = await prisma.sentence.findMany()

  res.json({
    allSentences: all
  })
})

router.post('/quote', async (req, res, next) => {
  const newSentenceSchema = z.object({
    newSentence: z.string()
  })

  const result = newSentenceSchema.safeParse(req.body)

  try {
    if(result.success){
      const { newSentence } = result.data
      const addNewSentence = await prisma.sentence.create({
        data:{
          text: newSentence
        }
      })
      res.json({
        newSentence: addNewSentence
      })
    } else {
      return res.status(400).json({error: 'Please send "newSentence" at the body of your request'})
    }
  } catch (error) {
    next(error)
  }
})

router.get('/search', (req, res) => {
  const textSchema = z.object({
    text: z.string().trim().nonempty()
  })

  const textResult = textSchema.safeParse(req.query)

  if (textResult.success) {
    const { text } = textResult.data
    const filtrado = sentences.filter(sentence => sentence.toLowerCase().includes(text.toLowerCase()))
    res.json({sentences: filtrado})
  } else {
    res.status(400).json({error: "You must provide a ?text query parameter"})
  }
})

router.get('/random', (req, res) => {
  const schema = z.object({
    count: z.coerce.number().min(1).int().lte(sentences.length)
  })

  const result = schema.safeParse(req.query)

  if (result.success){
    const { count } = result.data
    const randomSentences = [...sentences].sort(() => Math.random() - 0.5)
    res.json({sentences: randomSentences.slice(0, count)})
  } else{
    res.status(400).json({error: `You must provide a valid numeric 'count' query parameter between 1 and ${sentences.length}`})
  }
})

router.delete('/quote', async (req, res, next) => {
  const deleteSchema = z.object({
    id: z.coerce.number().int().positive()
  })

  const result = deleteSchema.safeParse(req.query)

  if (result.success){
    const { id, text } = result.data
    try {
      await prisma.sentence.delete({
        where: {
          id: id
        }
      })
      return res.json({success: `Sentence with id ${id} was removed successfully!`})
    } catch (error) {
      if (error.code === 'P2025'){
        return res.status(404).json({error: "Sentence with this id was not found."})
      } else {
        next(error)
      }
    }
  } else {
    return res.status(400).json({error: "Please provide a valid numeric 'id' query parameter."})
  }
})

router.put('/quote', async (req, res, next) => {
  const schema = z.object({
    id: z.coerce.number().int().positive(),
    newSentence: z.string().trim().nonempty(),
  })

  const result = schema.safeParse(req.body)

  if(result.success){
    const { id, newSentence } = result.data

    try {
      await prisma.sentence.update({
        where: {
          id: id
        },
        data: {
          text: newSentence
        }
      })
      return res.json({success: `Sentence with id ${id} was updated successfully to ${newSentence}`})
    } catch (error) {
      if (error.code === 'P2025'){
        return res.status(404).json({error: "Sentence with this id was not found."})
      } else {
        next(error)
      }
    }
  } else {
    return res.status(400).json({error: "Please include the sentence you want to update, and the updated sentence"})
  }
})

router.get('/random-by-lang', (req, res) => {
  const langSchema = z.object({
    lang: z.enum(['pt', 'en', 'zh'])
  })

  const result = langSchema.safeParse(req.query)

  if(result.success){
    const { lang } = result.data
    const detectLanguage = (sentence) => {
      if(/[\u4e00-\u9fff]/.test(sentence)){
        return 'zh'
    } else if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(sentence)){
      return 'pt'
    } else {
      return 'en'
    }
  }

  const filtered = sentences.filter((sentence) => {
    return detectLanguage(sentence) === lang
  })

  if(filtered.length === 0) {
    return res.status(404).json({error: "No sentences found..."})
  }

  const randomIndex = Math.floor(Math.random() * filtered.length)
  const selectedSentence = filtered[randomIndex]

  return res.json({lang: `${lang}`, sentence: `${selectedSentence}`, total: `${filtered.length}`})

  } else {
    return res.status(400).json({error: "Please type a valid language (pt, en, or zh)"})
  }
})
