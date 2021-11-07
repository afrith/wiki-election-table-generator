import Koa from 'koa'
import winston from 'winston'
import koaLogger from 'koa-logger'
import path from 'path'
import render from 'koa-ejs'
import serve from 'koa-static'

import router from './routes'

const app = new Koa()

if (process.env.NODE_ENV === 'production') {
  winston.level = 'info'
} else {
  winston.level = 'debug'
}
app.use(koaLogger(str => winston.info(str)))

render(app, {
  root: path.join(__dirname, 'views'),
  layout: false,
  viewExt: 'ejs'
})

app.use(serve(path.join(__dirname, 'static')))

app.use(router.routes()).use(router.allowedMethods())

const port = process.env.PORT || 3000
app.listen(port, function (err) {
  if (err) {
    winston.error('Error starting server:', err)
    process.exit(1)
  }

  winston.info('Server listening on port', port)
})
