import express from 'express'
import { z } from 'zod'
import { detectLanguage } from '../utils/detectLanguage.js'
import { prisma } from '../prismaClient.js'
import { createSentence, deleteSentence, getAllSentences, getPaginatedSentences, getRandomSentenceByLang, getRandomSentences, searchSentences, updateSentence } from '../services/sentencesServicePrisma.js'

export const router = express.Router()

router.get('/quote', async (req, res) => {
  const randomIndex = Math.floor(Math.random() * sentences.length)

  const randomQuote = sentences[randomIndex]

  res.json({sentence: randomQuote})
})

router.get('/all', async (req, res, next) => {
  const pageSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional()
  })

  const result = pageSchema.safeParse(req.query)

  if(result.success){
    const page = result.data.page ?? 1
    const limit = result.data.limit ?? 10

    const pagination = await getPaginatedSentences(page, limit)
    return res.json(pagination)
  } else {
    return res.status(400).json({error: "Page number not valid"})
  }
})

router.post('/quote', async (req, res, next) => {
  const newSentenceSchema = z.object({
    newSentence: z.string()
  })

  const result = newSentenceSchema.safeParse(req.body)

  try {
    if(result.success){
      const { newSentence } = result.data
      const addNewSentence = await createSentence(newSentence)
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

router.get('/search', async (req, res, next) => {
  const textSchema = z.object({
    text: z.string().trim().nonempty()
  })

  const textResult = textSchema.safeParse(req.query)
    if (textResult.success) {
      try {
        const { text } = textResult.data
        const filtrado = await searchSentences(text)
        res.json({total: filtrado.length, sentences: filtrado})
      } catch (error) {
        next(error)
      }
    } else {
      res.status(400).json({error: "You must provide a ?text query parameter"})
    }
})

router.get('/random', async (req, res, next) => {
  const schema = z.object({
    count: z.coerce.number().min(1).int()
  })

  const result = schema.safeParse(req.query)

  if (result.success){
    try {
      const { count } = result.data
      const selectedSentences = await getRandomSentences(count)
      res.json({count: count, sentences: selectedSentences})
    } catch (error) {
      next(error)
    }
  } else{
    res.status(400).json({error: "You must provide a valid numeric 'count' query parameter (min 1)"})
  }
})

router.delete('/quote', async (req, res, next) => {
  const deleteSchema = z.object({
    id: z.coerce.number().int().positive()
  })

  const result = deleteSchema.safeParse(req.query)

  if (result.success){
    const { id } = result.data
    try {
      await deleteSentence(id)
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
      await updateSentence(id, newSentence)
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

router.get('/random-by-lang', async (req, res, next) => {
  const langSchema = z.object({
    lang: z.enum(['pt', 'en', 'zh'])
  })

  const result = langSchema.safeParse(req.query)

  if(result.success){
    try {
      const { lang } = result.data
      const { sentence, total } = await getRandomSentenceByLang(lang)

      return res.json({lang, sentence, total})

    } catch (error) {
      next(error)
    }
  } else {
    return res.status(400).json({error: "Please type a valid language (pt, en, or zh)"})
  }
})
