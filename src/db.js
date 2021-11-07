import { Pool, types } from 'pg'

types.setTypeParser(20, val => parseInt(val, 10))

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost/election-results' })

export const getMunicipalities = async electionDate => {
  const results = await pool.query(
    `SELECT muni.code as muni_code, muni.name as muni_name, prov.name as prov_name
    FROM muni JOIN election ON muni.delim_id = election.delim_id
      left join prov on muni.prov_id = prov.id
    WHERE election.date = $1 AND muni.code NOT LIKE '%DMA%'
    ORDER BY UPPER(prov.name), UPPER(muni.name)`,
    [electionDate]
  )
  return results.rows
}

export const getMuniName = async (muniCode, electionDate) => {
  const result = await pool.query(
    'SELECT muni.name FROM muni JOIN election ON muni.delim_id = election.delim_id WHERE muni.code = $1 AND election.date = $2',
    [muniCode, electionDate]
  )
  return result.rows.length ? result.rows[0].name : null
}

export const getPartyVotes = async (muniCode, electionDate) => {
  const result = await pool.query(
    `SELECT wikilink, ward_votes, pr_votes, total_votes, perc, ward_seats, pr_seats, total_seats
    FROM wiki.muni_party_list WHERE muni_code = $1 AND election = $2`,
    [muniCode, electionDate]
  )
  return result.rows
}

export const getBallotTotals = async (muniCode, electionDate) => {
  const result = await pool.query(
    `SELECT ward_valid, ward_spoilt, ward_total, pr_valid, pr_spoilt, pr_total, total_valid, total_spoilt, total_total, ward_seats, pr_seats, total_seats
    FROM wiki.muni_totals WHERE muni_code = $1 AND election = $2`,
    [muniCode, electionDate]
  )
  return result.rows[0]
}

export const getTurnout = async (muniCode, electionDate) => {
  const result = await pool.query(
    'SELECT turnout, regpop, turnout_perc FROM wiki.muni_turnout WHERE muni_code = $1 AND election = $2',
    [muniCode, electionDate]
  )
  return result.rows[0]
}
