const assert = require('assert')
const path = require('path')
const { parse } = require('../src/parse.js')

describe('parse', function () {
    it('parse *.js file',async function () {
        const start = path.resolve('./testData/Dir1/test1.js')
        const test = await parse(start)
        const result = test('test')
        assert.equal(result, 'test')
    })
    it('parse *.json file', function () {
            
    })
})