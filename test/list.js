const assert = require('assert')
const path = require('path')
const { list } = require('../src/list.js')

describe('list', function () {
    it('should list files', async function () {
        const start = path.resolve('./testData')
        const files = await list(start, {
            matchers: [],
            recurse: true,
            dirs: false
        })
        assert.equal(files.length, 3)
    })
    it('should list one file', async function () {
        const start = path.resolve('./testData')
        const files = await list(start, {
            matchers: [/\.js$/i],
            recurse: true,
            dirs: false
        })
        assert.equal(files.length, 1)
    })
    it('should list dirs', async function () {
        const start = path.resolve('./testData')
        const dirs = await list(start, {
            matchers: [],
            recurse: false,
            dirs: true
        })
        assert.equal(dirs.length, 2)
    })
})