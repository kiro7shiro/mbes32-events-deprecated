const assert = require('assert')
const path = require('path')
const { list, Errors } = require('../src/list.js')

const testData = path.resolve(__dirname, './testData')

describe('list()', function () {

    it(`start not exists`, async function () {
        await assert.rejects(list(testData + '!'), Errors.StartNotExists)
    })

    it('list all files', async function () {
        const files = await list(testData)
        assert.strictEqual(files.length, 10)
    })

    it('list *.js file(s)', async function () {
        const JsFiles = await list(testData, {
            matchers: [/\.js\b/i]
        })
        assert.strictEqual(JsFiles.length, 3)
    })

    it('list *.json file(s)', async function () {
        const JsonFiles = await list(testData, {
            matchers: [/\.json\b/i]
        })
        assert.strictEqual(JsonFiles.length, 1)
    })

    it('list *.xlsx file(s)', async function () {
        const xlsxFiles = await list(testData, {
            matchers: [/\.xlsx\b/i]
        })
        assert.strictEqual(xlsxFiles.length, 5)
    })

    it('should list dirs', async function () {
        const dirs = await list(testData, {
            recurse: false,
            dirs: true
        })
        assert.strictEqual(dirs.length, 4)
    })

})