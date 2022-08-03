const assert = require('assert')
const path = require('path')
const { adapt, validate, Errors } = require('../src/analyze.js')

const testData = path.resolve(__dirname, './testData')

describe('analyze', async function () {

    it('config invalid', async function () {
        const filename = path.resolve(testData, './Dir3/test3.xlsx')
        await assert.rejects(validate(filename, {}), Errors.ConfigInvalid)
    })

    it('sheet missing', async function () {
        const filename = path.resolve(testData, './Dir3/test3.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './Dir3/test3Config.js'))) 
        config.worksheet = 'missing'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(errors[0] instanceof Errors.SheetMissing)
    })

    it('inconsistent sheet name', async function () {
        const filename = path.resolve(testData, './Dir3/test3.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './Dir3/test3Config.js'))) 
        config.worksheet = 'Tabelle2'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(errors[0] instanceof Errors.InconsistentSheetName)
    })

    it('incorrect row offset', async function () {
        const filename = path.resolve(testData, './Dir3/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './Dir3/test5Config.js'))) 
        config.rowOffset = 0
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(errors[0] instanceof Errors.IncorrectRowOffset)
    })

    it('incorrect column index', async function () {
        const filename = path.resolve(testData, './Dir3/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './Dir3/test5Config.js'))) 
        config.columns[0].index = 0
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(errors[0] instanceof Errors.IncorrectColumnIndex)
    })

    it('missing data header', async function () {
        const filename = path.resolve(testData, './Dir3/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './Dir3/test5Config.js'))) 
        config.columns[0].header = 'missing'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(errors[0] instanceof Errors.MissingDataHeader)

    })

    it('data header not in config', async function () {
        const filename = path.resolve(testData, './Dir3/test5.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './Dir3/test5Config.js'))) 
        config.columns[0].header = 'missing'
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(errors[1] instanceof Errors.DataHeaderNotInConfig)
    })

    it('invalid data', async function () {
        const filename = path.resolve(testData, './Dir3/test6.xlsx')
        const config = Object.assign({}, require(path.resolve(testData, './Dir3/test3Config.js'))) 
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(errors[0] instanceof Errors.InvalidData)
    })

    it('test a valid file', async function () {
        const filename = path.resolve(testData, './Dir3/test3.xlsx')
        const config = require(path.resolve(testData, './Dir3/test3Config.js'))
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
        assert(!errors.length)
    })

    it('test an invalid file', async function () {
        const filename = path.resolve(testData, './Dir3/test5.xlsx')
        const config = require(path.resolve(testData, './Dir3/test3Config.js'))
        const errors = await validate(filename, config)
        //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'valid'])
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