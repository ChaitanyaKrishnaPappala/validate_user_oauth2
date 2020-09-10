import pkg from 'pg'
import dotenv from 'dotenv'

const {Pool} = pkg
dotenv.config()

const poolObj = {
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_TP_DATABASE_URL
}
if (!process.env.LOCAL_TP_DATABASE_URL) {
  poolObj.ssl = {rejectUnauthorized: false}
}

const pool = new Pool(poolObj)
export default pool
