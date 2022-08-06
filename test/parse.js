const assert = require('assert')
const path = require('path')
const { parse, Errors } = require('../src/parse.js')

const testData = path.resolve(__dirname, './testData')

describe('parse()', function () {

    it('invalid config', async function () {
        const filename = path.resolve(testData, './parse/test3.xlsx')
        // TODO : use analyze Errors.ConfigInvalid instead
        await assert.rejects(parse(filename, {}), Errors.ConfigInvalid)
    })

    it('unsupported file format', async function () {
        const filename = path.resolve(testData, './parse/test3.txt')
        await assert.rejects(parse(filename, {}), Errors.UnsupportedFileFormat)
    })

    it('parse *.js file', async function () {
        const filename = path.resolve(testData, './parse/test1.js')
        const test = await parse(filename)
        const result = test('test')
        assert.strictEqual(result, 'test')
    })

    it('parse *.json file', async function () {
        const filename = path.resolve(testData, './parse/test2.json')
        const { test } = await parse(filename)
        assert.strictEqual(test.length, 3)
    })

    it('parse *.xlsx file', async function () {
        const filename = path.resolve(testData, './parse/test3.xlsx')
        const config = path.resolve(testData, './parse/test3Config.js')
        const test = await parse(filename, { config })
        assert.strictEqual(test.length, 1)
    })

})