import Koa from 'koa'
import Router from 'koa-router'
import winston from 'winston'
import koaLogger from 'koa-logger'
import path from 'path'
import render from 'koa-ejs'
import serve from 'koa-static'

const app = new Koa();
const router = new Router();

if (process.env.NODE_ENV === 'production') {
  winston.level = 'info'
} else {
  winston.level = 'debug'
}
app.use(koaLogger(str => winston.info(str)));

render(app, {
  root: path.join(__dirname, 'views'),
  layout: false,
  viewExt: 'ejs',
  writeResp: false
})

router.get('/', async ctx => {
  ctx.body = await ctx.render('index')
})

app.use(router.routes()).use(router.allowedMethods());

app.use(serve(__dirname + '/static'));

const port = process.env.PORT || 3000;
app.listen(port, function (err) {
  if (err) {
    winston.error('Error starting server:', err);
    process.exit(1);
  }

  winston.info('Server listening on port', port);
})