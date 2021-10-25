const assert = require('assert')
const { getDatabaseConfig, getEventsData } = require('../src/database.js')

describe('database', function () {

    it('should return database config filename', function () {

        const valid = '/home/kiro/Development/mbes32-events/test/reports/database/database-config.js'
        const config = getDatabaseConfig()
        assert.equal(config, valid)

    })

    it('should return events data', async function () {
        
        const data = await getEventsData()
        assert.ok(data.length, 'data should have length')

    })

})