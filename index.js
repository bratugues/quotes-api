import express from "express";
import { router } from "./routes/sentences.js";

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  const dateTime = new Date()
  const currentDateTime = dateTime.toLocaleString('pt-BR')
  const log = `Request made on ${currentDateTime} - Method: ${req.method} - URL: ${req.url}`
  console.log(log)
  next()
})

app.use('/', router)

app.use((err, req, res, next) => {
console.log(err)
const status = err.statusCode || 500
const finalMessage = err.message ? err.message : 'Internal server error'
res.status(status).json({ success: false, error: `${finalMessage}` })
})

app.listen(7777, () => {
  console.log("server running at port 7777")
})
