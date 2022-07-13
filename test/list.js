const assert = require('assert')
const path = require('path')
const { list } = require('../src/list.js')

describe('list', function () {
    it('should list all files', async function () {
        const start = path.resolve(process.cwd(), './test/testData')
        const files = await list(start, {
            matchers: [],
            recurse: true,
            dirs: false
        })
        assert.equal(files.length, 6)
    })
    it('should list matched files (*.js, *.json, *.xlsx)', async function () {
        const start = path.resolve(process.cwd(), './test/testData')
        const files = await list(start, {
            matchers: [/\.js$/i, /\.json$/i, /\.xlsx$/i],
            recurse: true,
            dirs: false
        })
        assert.equal(files.length, 6)
    })
    it('should list dirs', async function () {
        const start = path.resolve(process.cwd(), './test/testData')
        const dirs = await list(start, {
            matchers: [],
            recurse: false,
            dirs: true
        })
        assert.equal(dirs.length, 4)
    })
})