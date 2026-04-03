import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { seedIfEmpty } from './seed.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const file = join(__dirname, '..', 'data', 'db.json')

const defaultData = {
  users: [],
  steps: [],
  apps: [],
  appGroups: [],
  groups: [],
  groupMembers: [],
  unlockEvents: []
}

const adapter = new JSONFile(file)
const db = new Low(adapter, defaultData)

export async function initDb() {
  await db.read()
  db.data ||= structuredClone(defaultData)
  await seedIfEmpty(db)
  await db.write()
  return db
}

export function getDb() {
  return db
}
