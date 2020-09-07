import {createUser} from '../controller/user.js'

export default function routes (router, auth) {
  router.post('/user', auth.oauth.grant(), createUser)
  return routes
}
