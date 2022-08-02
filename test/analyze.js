const assert = require('assert')
const path = require('path')
const { adapt, validate, Errors } = require('../src/analyze.js')

const testData = path.resolve(__dirname, './testData')

describe('analyze', async function () {

    it('config invalid', async function () {
        const filename = path.resolve(testData, './Dir3/test3.xlsx')
        await assert.rejects(validate(filename, {}), Errors.ConfigInvalid)
    })

    it('test a valid file', async function () {
        const filename = path.resolve(testData, './Dir3/test3.xlsx')
        const config = require(path.resolve(testData, './Dir3/test3Config.js'))
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'valid', 'key'])
        assert(!errors.length)
    })

    it('test an invalid file', async function () {
        const filename = path.resolve(testData, './Dir3/test5.xlsx')
        const config = require(path.resolve(testData, './Dir3/test3Config.js'))
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'valid', 'key'])
        assert(errors.length >= 1)
    })

    it('adapt a config', async function () {
        const filename = path.resolve(testData, './Dir3/test5.xlsx')
        const config = require(path.resolve(testData, './Dir3/test3Config.js'))
        const errors = await validate(filename, config)
        const adaption = adapt(config, errors)
        assert.strictEqual(adaption.worksheet, 'Tabelle2')
    })

})