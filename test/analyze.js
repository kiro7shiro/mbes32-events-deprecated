const assert = require('assert')
const path = require('path')
const { adapt, validate, Errors } = require('../src/analyze.js')

const testData = path.resolve(__dirname, './testData')

describe('analyze', async function () {

    it('config invalid', async function () {
        const filename = path.resolve(testData, './analyze/test5.xlsx')
        await assert.rejects(validate(filename, {}), Errors.ConfigInvalid)
    })

    it('sheet missing', async function () {
        const filename = path.resolve(testData, './analyze/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
        config.worksheet = 'missing'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert.throws(() => { throw errors[0] }, Errors.SheetMissing)
    })

    it('inconsistent sheet name', async function () {
        const filename = path.resolve(testData, './analyze/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
        config.worksheet = 'Tabelle1'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert.throws(() => { throw errors[0] }, Errors.InconsistentSheetName)
    })

    it('incorrect row offset', async function () {
        const filename = path.resolve(testData, './analyze/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
        config.rowOffset = 0
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert.throws(() => { throw errors[0] }, Errors.IncorrectRowOffset)
    })

    it('incorrect column index', async function () {
        const filename = path.resolve(testData, './analyze/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
        config.columns[0].index = 0
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert.throws(() => { throw errors[0] }, Errors.IncorrectColumnIndex)
    })

    it('missing data header', async function () {
        const filename = path.resolve(testData, './analyze/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
        config.columns[0].header = 'missing'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert.throws(() => { throw errors[0] }, Errors.MissingDataHeader)
    })

    it('data header not in config', async function () {
        const filename = path.resolve(testData, './analyze/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
        config.columns[0].header = 'missing'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        //assert(errors[1] instanceof Errors.DataHeaderNotInConfig)
        assert.throws(() => { throw errors[1] }, Errors.DataHeaderNotInConfig)
    })

    it('invalid data', async function () {
        const filename = path.resolve(testData, './analyze/test6.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './analyze/test6Config.js')))
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert.throws(() => { throw errors[0] }, Errors.InvalidData)
    })

    it('test a valid file')
    it('test an invalid file')
    it('adapt a config')

})