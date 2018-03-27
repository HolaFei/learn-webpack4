const util = require('util')
const path = require('path')
const fs = require('fs')

const bodyParser = require('body-parser')

const asyncReadFile = util.promisify(fs.readFile)

module.exports = app => {
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))

  app.use('/data', async (req, res, next) => {
    const file = path.resolve(__dirname, `data${req.path}`)
    try {
      const fileData = await asyncReadFile(file, 'utf8')
      res.json(JSON.parse(fileData))
    } catch (e) {
      res.status(50001).json({err: e.stack})
    }
  })
}
