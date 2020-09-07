import pool from './index.js'
import {getToken, enocodePassword} from '../../util/index.js'
import {INACTIVE_STATUS, ACTIVE_STATUS} from '../../util/constants.js'

export const createUserDAO = (user) => {
  const {
    email, password, firstName = '', lastName = ''
  } = user
  const query = `INSERT INTO users (email, password, first_name, last_name, status, activation_token) 
           VALUES ('${email}', '${enocodePassword(password)}', '${firstName}', '${lastName}',
            '${INACTIVE_STATUS}', '${getToken()}') RETURNING *`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(Array.isArray(result.rows) && result.rows.length > 0
          ? result.rows[0] : null)
      }
    })
  })
}

export const deleteUserDAO = (email) => {
  const query = `DELETE FROM users WHERE email='${email}'`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result.rowCount)
      }
    })
  })
}

export const getAccessTokenDAO = (bearerToken) => {
  const query = `SELECT * FROM access_tokens WHERE access_token = '${bearerToken}'`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve({
          accessToken: bearerToken,
          expires: null,
          user: {
            id: Array.isArray(result.rows) && result.rows.length > 0
              ? result.rows[0].email : null
          }
        })
      }
    })
  })
}

export const saveAccessTokenDAO = (accessToken, clientId, expires, userDetails) => {
  const {email} = userDetails
  return new Promise((resolve, reject) => {
    if (!email) {
      reject(new Error('Missing user email'))
    } else {
      const query = `INSERT INTO access_tokens (access_token, email) VALUES ('${accessToken}', '${email}')`
      pool.query(query, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(Array.isArray(result.rows) && result.rows.length > 0
            ? result.rows[0] : null)
        }
      })
    }
  })
}

export const getUserDAO = (email, password) => {
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${enocodePassword(password)}' 
  AND status='${ACTIVE_STATUS}'`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(Array.isArray(result.rows) && result.rows.length > 0
          ? result.rows[0] : null)
      }
    })
  })
}

export const getAllUsersByKeysDAO = (keys) => {
  let query = 'SELECT '
  if (Array.isArray(keys) && keys.length > 0) {
    keys.forEach((key, index) => {
      query += `${key}${index !== keys.length - 1 ? ',' : ''} `
    })
  } else {
    query += '* '
  }
  query += `FROM users WHERE status = '${ACTIVE_STATUS}'`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result.rows)
      }
    })
  })
}

export const checkIfUserExistsDAO = (email) => {
  const query = `SELECT email FROM users WHERE email='${email}'`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result.rowCount > 0)
      }
    })
  })
}

export const getUserDetailsByEmailDAO = (email) => {
  const query = `SELECT * FROM users WHERE email='${email}'`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(Array.isArray(result.rows) && result.rows.length > 0
          ? result.rows[0] : null)
      }
    })
  })
}

export const activateUserDAO = (activationToken) => {
  const query = `UPDATE users SET status='${ACTIVE_STATUS}' 
  WHERE activation_token='${activationToken}' RETURNING *`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(Array.isArray(result.rows) && result.rows.length > 0
          ? result.rows[0] : null)
      }
    })
  })
}

export const updatedUserPasswordDAO = (user) => {
  const {email, password} = user
  const query = `UPDATE users SET password='${enocodePassword(password)}' WHERE email='${email}' RETURNING *`
  return new Promise((resolve, reject) => {
    pool.query(query, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(Array.isArray(result.rows) && result.rows.length > 0
          ? result.rows[0] : null)
      }
    })
  })
}
