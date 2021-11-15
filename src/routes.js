import Router from 'koa-router'
import { groupBy } from 'lodash'
import { getMuniName, getPartyVotes, getBallotTotals, getTurnout, getMunicipalities } from './db'

const router = new Router()

router.get('/', async ctx => {
  await ctx.render('index')
})

const formatPartyLink = wikilink => {
  const match = wikilink.match(/^(.*) \(.*\)$/)
  if (match) {
    return `[[${wikilink}|${match[1]}]]`
  } else {
    return `[[${wikilink}]]`
  }
}

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

  const showShortLink = partyVotes.filter(row => row.total_seats === 0 && row.wikilink !== 'Independent candidates').length > 1

  await ctx.render('table', { election, muniCode, muniName, showShortLink, partyVotes, others: null, ballotTotals, turnout, formatPartyLink })
})

router.get('/:election/:muni_code/short', async ctx => {
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

  const visiblePartyVotes = partyVotes.filter(row => row.total_seats > 0 || row.wikilink === 'Independent candidates')
  const otherPartyVotes = partyVotes.filter(row => row.total_seats === 0 && row.wikilink !== 'Independent candidates')

  console.log(otherPartyVotes)
  const others = otherPartyVotes.reduce((previous, current) => ({
    ward_votes: previous.ward_votes + (current.ward_votes || 0),
    pr_votes: previous.pr_votes + (current.pr_votes || 0),
    total_votes: previous.total_votes + (current.total_votes || 0),
    perc: previous.perc + (current.perc || 0),
    count: previous.count + 1
  }), { ward_votes: 0, pr_votes: 0, total_votes: 0, perc: 0, count: 0 })

  await ctx.render('shorttable', { election, muniCode, muniName, partyVotes: visiblePartyVotes, others, ballotTotals, turnout, formatPartyLink })
})

export default router
