import Router from 'koa-router'

const router = new Router()

router.get('/', async ctx => {
  ctx.body = await ctx.render('index')
})

export default router
