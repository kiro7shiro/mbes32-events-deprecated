const path = require('path')
const { parse } = require('./parse.js')
const settings = require('../settings.json')

function getDatabaseConfig() {
    return path.resolve(settings['reports-folder'], './database/database-config.js')
}

async function getEventsData() {
    const config = await parse(getDatabaseConfig())
    return await parse(settings['events-database'], { config })
}

module.exports = {
    getEventsData,
    getDatabaseConfig
}