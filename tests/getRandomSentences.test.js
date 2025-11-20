import { getRandomSentences } from "../services/sentencesServicePrisma";
import { prisma } from '../prismaClient.js'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe("getRandomSentences", () => {

  beforeEach(() => {
  vi.clearAllMocks()
})

  it("should return count random sentences", async () => {
     prisma.sentence.findMany = vi.fn().mockResolvedValue([
   { id: 1, text: "A" },
   { id: 2, text: "B" },
   { id: 3, text: "C" },
   { id: 4, text: "D" },
   { id: 5, text: "E" }
 ])

 const result = await getRandomSentences(3)
 expect(result.length).toBe(3)
   })

  it("should return error if count > sentences", async () => {
     prisma.sentence.findMany = vi.fn().mockResolvedValue([
   { id: 1, text: "A" },
   { id: 2, text: "B" },
   { id: 3, text: "C" },
   { id: 4, text: "D" },
   { id: 5, text: "E" }
 ])

 try {
   const result = await getRandomSentences(5)
 } catch (error) {
  expect(error.statusCode).toBe(400)
 }
   })
})
