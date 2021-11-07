import Router from 'koa-router'
import { groupBy } from 'lodash'
import { getMuniName, getPartyVotes, getBallotTotals, getTurnout, getMunicipalities } from './db'

const router = new Router()

router.get('/', async ctx => {
  await ctx.render('index')
})

const formatDate = date => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
const formatNumber = number => number === null ? '–' : new Intl.NumberFormat('en-GB').format(number)
const formatPercent = percent => new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(percent)

const elections = {
  lge2000: { date: new Date('2000-12-05') },
  lge2006: { date: new Date('2006-03-01') },
  lge2011: { date: new Date('2011-05-18') },
  lge2016: { date: new Date('2016-08-03') },
  lge2021: { date: new Date('2021-11-01') }
}

router.get('/:election', async ctx => {
  const election = elections[ctx.params.election]
  if (!election) return ctx.throw(404, `No such election as "${ctx.params.election}".`)
  election.code = ctx.params.election

  const municipalities = await getMunicipalities(election.date)
  const provinces = groupBy(municipalities, row => row.prov_name || 'Cross-border Municipalities')

  await ctx.render('election', { election, provinces })
})

router.get('/:election/:muni_code', async ctx => {
  const election = elections[ctx.params.election]
  if (!election) return ctx.throw(404, `No such election as "${ctx.params.election}".`)
  election.code = ctx.params.election

  const muniCode = ctx.params.muni_code
  const muniName = await getMuniName(muniCode, election.date)
  if (!muniName) return ctx.throw(404, `No such municipality as "${muniCode}" in election "${ctx.params.election}".`)

  const [partyVotes, ballotTotals, turnout] = await Promise.all([
    getPartyVotes(muniCode, election.date),
    getBallotTotals(muniCode, election.date),
    getTurnout(muniCode, election.date)
  ])
  await ctx.render('table', { election, muniName, partyVotes, ballotTotals, turnout, formatDate, formatNumber, formatPercent })
})

export default router
