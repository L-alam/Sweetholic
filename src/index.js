const express = require('express')
const app = express()
const port = process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/second', (req, res) => {
    res.send('this is the second screen')
})

app.listen(port, () => {
  console.log(`Example app not listening on port ${port}`)
})