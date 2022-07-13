const assert = require('assert')
const path = require('path')
const { parse } = require('../src/parse.js')

describe('parse', function () {
    it('should parse *.js file', async function () {
        const start = path.resolve(process.cwd(), './test/testData/Dir1/test1.js')
        const test = await parse(start)
        const result = test('test')
        assert.equal(result, 'test')
    })
    it('should parse *.json file', async function () {
        const start = path.resolve(process.cwd(), './test/testData/Dir2/test2.json')
        const { test2 } = await parse(start)
        assert.equal(test2.length, 3)
    })
    it('should parse *.xlsx file', async function () {
        const start = path.resolve(process.cwd(), './test/testData/Dir3/test3.xlsx')
        const config = path.resolve(process.cwd(), './test/testData/Dir3/test3Config.js')
        const test3 = await parse(start, { config })
        assert.equal(test3.length, 1)
    })
})