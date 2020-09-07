import nodemailer from 'nodemailer'

let testAccount = null
let transporter = null

const createTestAccount = async () => {
  if (!testAccount) {
    return await nodemailer.createTestAccount()
  }
}

const createTransporter = async () => {
  if (!transporter) {
    const obj = {
      service: `${process.env.EMAIL_SERVER}`,
      host: `${process.env.EMAIL_SERVER_NAME}`,
      port: `${process.env.EMAIL_SERVER_PORT}`,
      auth: {
        user: `${process.env.EMAIL_SERVER_USERNAME}`,
        pass: `${process.env.EMAIL_SERVER_PASSWORD}`
      }
    }
    return nodemailer.createTransport(obj)
  }
}

export const initializeNodeMailer = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!(testAccount || transporter)) {
        createTestAccount().then((account) => {
          testAccount = account
          createTransporter().then((newTransporter) => {
            transporter = newTransporter
            resolve('Successfully initialized Node Mailer')
          })
        })
      } else {
        resolve('Successfully initialized Node Mailer')
      }
    } catch (e) {
      reject(e)
    }
  })
}

export const sendEmail = async (email, subject, text, html = null) => {
  return await transporter.sendMail({
    from: `${process.env.EMAIL_SERVER_FROM}`, // sender address
    to: email, // list of receivers
    subject,
    text,
    html
  })
}
