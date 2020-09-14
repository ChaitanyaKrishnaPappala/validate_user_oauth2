import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import oAuth2Server from 'node-oauth2-server'
import model from './oauth/model.js'
import {createUser, activateUser, getAllUsers, updateUserPassword} from './controller/user.js'
import {initializeNodeMailer} from './controller/email.js'

dotenv.config()

const app = new express() //eslint-disable-line

app.oauth = oAuth2Server({
  model,
  grants: ['password'],
  debug: false,
  useErrorHandler: true
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-Wieth, Content-Type, Accept, Authorization')
  res.header('Access-Control-Expose-Headers', 'Authorization')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  return next()
})

app.post('/user/register', createUser)
app.get('/user/activate/:activation_token', activateUser)
app.post('/user/login', app.oauth.grant())
app.post('/user/all', getAllUsers)
app.put('/user/password', updateUserPassword)
// app.get('/dbconfig', (req, res, next) => {
//   res.status(200).json({
//     env: process.env
//   })
// })

app.use(function (err, req, res, next) {
  if (err instanceof Error) {
    return res.status(err.code).send({message: err.toString(), error: err.error})
  }
})
app.use(app.oauth.errorHandler())
const port = process.env.PORT || 80

app.listen(port, (err) => {
  if (!err) {
    console.log(`Server Running on port - ${port}`)
    initializeNodeMailer().then((resp) => {
      console.log(resp)
    }).catch((ex) => {
      console.log(ex.toString())
    })
    } //eslint-disable-line
  else {
    console.log(err)
    } //eslint-disable-line
})
