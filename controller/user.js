import {
  createUserDAO, checkIfUserExistsDAO, activateUserDAO,
  getAllUsersByKeysDAO, deleteUserDAO,
  getUserDetailsByEmailDAO, updatedUserPasswordDAO
} from '../db/postgres/dao.js'
import {validateEmailAddress, validateAuthorization, enocodePassword} from '../util/index.js'
import {
  FAILED_TO_REGISTER_USER, FAILED_TO_ACTIVATE_USER,
  FAILED_TO_FETCH_USERS, INVALID_AUTHORIZATION_TOKEN, FAILED_TO_UPDATE_PASSWORD,
  PASSWORD_NO_MATCH, SUCCESS_UPDATE_PASSWORD, USER_DETAILS_NOT_FOUND,
  MISSING_EMAIL_ADDRESS, MISSING_ACTIVATION_TOKEN, INVALID_EMAIL_ADDRESS, INVALID_ACTIVATION_TOKEN,
  USER_ALREADY_EXISTS, MISSING_PASSWORD, MISSING_NEW_PASSWORD, SUCCESS_USER_ACTIVATED,
  SUCCESS_USER_ACCOUNT_CREATED
} from '../util/constants.js'
import {sendEmail} from './email.js'

export const createUser = (req, res, next) => {
  try {
    // validation for request body
    if (!req.body['email address']) {
      return res.status(400).json({message: FAILED_TO_REGISTER_USER, error: MISSING_EMAIL_ADDRESS})
    } else if (!req.body.password) {
      return res.status(400).json({message: FAILED_TO_REGISTER_USER, error: MISSING_PASSWORD})
    }
    if (!validateEmailAddress(req.body['email address'])) {
      return res.status(400).json({message: FAILED_TO_REGISTER_USER, error: INVALID_EMAIL_ADDRESS})
    }
    const userObj = {
      email: req.body['email address'],
      password: req.body.password,
      firstName: req.body['first name'],
      lastName: req.body['last name']
    }

    // check if user exists already
    checkIfUserExistsDAO(userObj.email)
      .then((isUserExists) => {
        if (!isUserExists) {
          createUserDAO(userObj)
            .then(async (data) => {
              data.password = req.body.password
              // send email
              const activationUrl = process.env.HOST_NAME === 'localhost'
              // eslint-disable-next-line max-len
                ? `${process.env.PROTOCOL}://${process.env.HOST_NAME}:${process.env.PORT || 80}/user/activate/${data.activation_token}`
                : `${process.env.PROTOCOL}://${process.env.HOST_NAME}/user/activate/${data.activation_token}`
              await sendEmail(userObj.email, 'Account Activation', activationUrl)
                .then((emailDetails) => {
                  // delete secured information
                  const keysToDelete = ['status', 'activation_token']
                  data && keysToDelete.forEach((key) => {
                    if (data[key]) {
                      delete data[key]
                    }
                  })
                  return res.status(201).json({message: SUCCESS_USER_ACCOUNT_CREATED, data})
                }).catch((ex) => {
                  deleteUserDAO(userObj.email)
                  return res.status(500).json({message: FAILED_TO_REGISTER_USER, error: ex.toString()})
                })
            }).catch((ex) => {
              deleteUserDAO(userObj.email)
              return res.status(500).json({message: FAILED_TO_REGISTER_USER, error: ex.toString()})
            })
        } else {
          return res.status(500).json({message: FAILED_TO_REGISTER_USER, error: USER_ALREADY_EXISTS})
        }
      }).catch((ex) => {
        return res.status(500).json({message: FAILED_TO_REGISTER_USER, error: ex.toString()})
      })
  } catch (ex) {
    return res.status(500).json({message: FAILED_TO_REGISTER_USER, error: ex.toString()})
  }
}

export const activateUser = (req, res, next) => {
  try {
    // validation for request body
    if (!req.params.activation_token) {
      return res.status(400).json({message: FAILED_TO_ACTIVATE_USER, error: MISSING_ACTIVATION_TOKEN})
    }

    // activate and return user object
    activateUserDAO(req.params.activation_token).then((data) => {
      if (!data) {
        return res.status(400).json({message: FAILED_TO_ACTIVATE_USER, error: INVALID_ACTIVATION_TOKEN})
      }
      // delete secured information
      const keysToDelete = ['password', 'status', 'activation_token']
      data && keysToDelete.forEach((key) => {
        if (data[key]) {
          delete data[key]
        }
      })

      if (data) {
        if (data.password) {
          delete data.password
        }
      }
      return res.status(200).json({message: SUCCESS_USER_ACTIVATED, data})
    })
  } catch (ex) {
    return res.status(500).json({message: FAILED_TO_ACTIVATE_USER, error: ex.toString()})
  }
}

export const getAllUsers = (req, res, next) => {
  try {
    const keys = ['first_name']
    // return just first name when no Authorization supplied
    if (!req.header('Authorization')) {
      getAllUsersByKeysDAO(keys).then((data) => {
        return res.status(data ? 200 : 204).json({data})
      }).catch((ex) => {
        return res.status(500).json({
          message: FAILED_TO_FETCH_USERS,
          error: ex.toString(),
          local: process.env.LOCAL_TP_DATABASE_URL,
          url: process.env.DATABASE_URL
        })
      })
    } else {
      // validate authorization
      validateAuthorization(req.header('Authorization'))
        .then((tokenObj) => {
          if (tokenObj && tokenObj.user &&
                tokenObj.user.id && tokenObj.accessToken) {
            keys.push('last_name')
            keys.push('email')
            getAllUsersByKeysDAO(keys).then((data) => {
              return res.status(data ? 200 : 204).json({data})
            }).catch((ex) => {
              return res.status(500).json({
                message: FAILED_TO_FETCH_USERS,
                error: ex.toString(),
                url: process.env.DATABASE_URL
              })
            })
          } else {
            return res.status(400).json({
              message: FAILED_TO_FETCH_USERS,
              error: INVALID_AUTHORIZATION_TOKEN,
              url: process.env.DATABASE_URL
            })
          }
        }).catch((ex) => {
          return res.status(500).json({
            message: FAILED_TO_FETCH_USERS,
            error: ex.toString(),
            url: process.env.DATABASE_URL
          })
        })
    }
  } catch (ex) {
    return res.status(500).json({
      message: FAILED_TO_FETCH_USERS,
      error: ex.toString(),
      url: process.env.DATABASE_URL
    })
  }
}

export const updateUserPassword = (req, res, next) => {
  try {
    // req body validation
    if (!req.body.password) {
      return res.status(400).json({message: FAILED_TO_UPDATE_PASSWORD, error: MISSING_PASSWORD})
    } else if (!req.body['new password']) {
      return res.status(400).json({message: FAILED_TO_UPDATE_PASSWORD, error: MISSING_NEW_PASSWORD})
    }

    // validate authorization
    validateAuthorization(req.header('Authorization'))
      .then((tokenObj) => {
        if (tokenObj && tokenObj.user &&
              tokenObj.user.id && tokenObj.accessToken) {
          getUserDetailsByEmailDAO(tokenObj.user.id)
            .then((userDetails) => {
              if (userDetails && userDetails.password) {
                if (enocodePassword(req.body.password) !== userDetails.password) {
                  return res.status(400).json({message: FAILED_TO_UPDATE_PASSWORD, error: PASSWORD_NO_MATCH})
                } else {
                  // update user with new password
                  updatedUserPasswordDAO({
                    email: tokenObj.user.id,
                    password: req.body['new password']
                  }).then((data) => {
                    return res.status(200).json({message: SUCCESS_UPDATE_PASSWORD})
                  }).catch((ex) => {
                    return res.status(500).json({message: FAILED_TO_UPDATE_PASSWORD, error: ex.toString()})
                  })
                }
              } else {
                return res.status(400).json({message: FAILED_TO_UPDATE_PASSWORD, error: USER_DETAILS_NOT_FOUND})
              }
            }).catch((ex) => {
              return res.status(500).json({message: FAILED_TO_UPDATE_PASSWORD, error: ex.toString()})
            })
        } else {
          return res.status(400).json({message: FAILED_TO_UPDATE_PASSWORD, error: INVALID_AUTHORIZATION_TOKEN})
        }
      }).catch((ex) => {
        return res.status(500).json({message: FAILED_TO_UPDATE_PASSWORD, error: ex.toString()})
      })
  } catch (ex) {
    return res.status(500).json({message: FAILED_TO_UPDATE_PASSWORD, error: ex.toString()})
  }
}
