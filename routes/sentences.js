import express from 'express'
import { z } from 'zod'
import { loadSentences, writeSentences, detectLanguage } from '../services/sentencesService.js'
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

router.get('/search', async (req, res, next) => {
  const textSchema = z.object({
    text: z.string().trim().nonempty()
  })

  const textResult = textSchema.safeParse(req.query)
    if (textResult.success) {
      try {
        const { text } = textResult.data
        const filtrado = await prisma.sentence.findMany({where: {text: {contains: text}}})
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
      const sentences = await prisma.sentence.findMany()
      if (sentences.length === 0){
        return res.json({sentences: sentences})
      } else if (sentences.length < count) {
        return res.status(400).json({error: `Count must be between 1 and ${sentences.length}`})
      }

      const shuffled = [...sentences].sort(() => Math.random() - 0.5)
      const selectedSentences = shuffled.slice(0, count)
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

router.get('/random-by-lang', async (req, res, next) => {
  const langSchema = z.object({
    lang: z.enum(['pt', 'en', 'zh'])
  })

  const result = langSchema.safeParse(req.query)

  if(result.success){
    try {
      const { lang } = result.data
      const sentences = await prisma.sentence.findMany()

      const filtered = sentences.filter((sentence) => {
        return detectLanguage(sentence.text) === lang
    })

      if(filtered.length === 0) {
        return res.status(404).json({error: "No sentences found for this language."})
      }

      const randomIndex = Math.floor(Math.random() * filtered.length)
      const selectedSentence = filtered[randomIndex]

      return res.json({lang: lang, sentence: selectedSentence, total: filtered.length})

    } catch (error) {
      next(error)
    }
  } else {
    return res.status(400).json({error: "Please type a valid language (pt, en, or zh)"})
  }
})
