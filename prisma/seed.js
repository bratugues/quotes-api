import { PrismaClient } from "../generated/prisma/client.ts";
import fs from "fs"
import "dotenv/config"

const prisma = new PrismaClient()
const FILE_PATH = './data/sentences.json'

const sentences = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'))

const array = sentences.map((sentence) => {
  return { text: sentence }
})

async function main() {
  const addedSentences = await prisma.sentence.createMany({ data: array })
  console.log(`${addedSentences.count} sentences added successfully!`)
}

main()
.then(() => {
  prisma.$disconnect()
}).catch((err) => {
  console.log(err)
  prisma.$disconnect()
})
