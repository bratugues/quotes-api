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

  if(result.success){
    const { newSentence } = result.data
    sentences.push(newSentence)
    writeSentences(sentences)
    res.json({
      allSentences: sentences
    })
  } else {
    return res.status(400).json({error: 'Please send "newSentence" at the body of your request'})
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

router.delete('/quote', (req, res) => {
  const deleteSchema = z.object({
    text: z.string().trim().nonempty()
  })

  const result = deleteSchema.safeParse(req.query)

  if (result.success){
    const { text } = result.data

    const index = sentences.indexOf(text)

    if (index > -1){
      sentences.splice(index, 1)
      writeSentences(sentences)
      return res.json({success: "Sentence removed successfully!"})
    } else {
      return res.status(404).json({error: "Sentence not found"})
    }

  } else {
    return res.status(400).json({error: "Please send an existing and valid sentence!"})
  }
})

router.put('/quote', (req, res) => {
  const schema = z.object({
    oldSentence: z.string().trim().nonempty(),
    newSentence: z.string().trim().nonempty(),
  })

  const result = schema.safeParse(req.body)

  if(result.success){
    const { oldSentence, newSentence } = result.data

    const index = sentences.indexOf(oldSentence)

    if (index === -1){
      return res.status(404).json({error: "Sentence not found"})
    }

    sentences.splice(index, 1, newSentence)
    writeSentences(sentences)
    return res.json({success: `Sentence: ${oldSentence} was updated successfully to ${newSentence}`})
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
