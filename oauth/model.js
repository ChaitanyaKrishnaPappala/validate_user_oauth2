import {getUserDAO, getAccessTokenDAO, saveAccessTokenDAO} from '../db/postgres/dao.js'
import {INVALID_USER} from '../util/constants.js'

const model = {
  getAccessToken: (bearerToken, callback) => {
    getAccessTokenDAO(bearerToken)
      .then((data) => {
        callback(null, data)
      }).catch((ex) => {
        callback(ex.toString(), null)
      })
  },

  getClient: (clientID, clientSecret, callback) => {
    const client = {
      clientID,
      clientSecret,
      grants: null,
      redirectUris: null
    }
    callback(null, client)
  },

  grantTypeAllowed: (clientID, grantType, callback) => {
    callback(null, true)
  },

  getUser: (username, password, callback, same) => {
    getUserDAO(username, password).then((details) => {
      callback(details ? null : new Error(INVALID_USER), details)
    }).catch((err) => {
      callback(err.toString(), null)
    })
  },

  saveAccessToken: (accessToken, clientId, expires, userDetails, callback) => {
    saveAccessTokenDAO(accessToken, clientId, expires, userDetails)
      .then((data) => {
        callback(null, data)
      }).catch((ex) => {
        callback(ex.toString(), null)
      })
  }
}

export default model
