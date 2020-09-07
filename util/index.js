import {v4 as uuid} from 'uuid'
import crypto from 'crypto'
import {BEARER, INVALID_AUTHORIZATION_TOKEN} from './constants.js'
import model from '../oauth/model.js'
export const getToken = () => {
  return uuid()
}

export const validateEmailAddress = (email) => {
  return (/\S+@\S+\.\S+/).test(email)
}

export const enocodePassword = (pass) => {
  return crypto.createHash('sha256').update(pass).digest('hex')
}

// validate Authorization
export const validateAuthorization = (authObj) => {
  return new Promise((resolve, reject) => {
    try {
      if (authObj && authObj.startsWith(BEARER)) {
        const index = authObj.indexOf(BEARER)
        const accessToken = authObj.substring(index + BEARER.length)
        if (accessToken) {
          model.getAccessToken(accessToken, (err, tokenObj) => {
            if (err) {
              reject(err)
            } else {
              resolve(tokenObj)
            }
          })
        }
      } else {
        reject(new Error(INVALID_AUTHORIZATION_TOKEN))
      }
    } catch (e) {
      reject(e)
    }
  })
}
