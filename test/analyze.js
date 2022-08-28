const assert = require('assert')
const path = require('path')
const { adapt, validate, Errors } = require('../src/analyze.js')

const testData = path.resolve(__dirname, './testData')

describe('analyze', async function () {

    describe('validate()', function () {

        it('config invalid', async function () {
            const filename = path.resolve(testData, './analyze/test5.xlsx')
            await assert.rejects(validate(filename, {}), Errors.ConfigInvalid)
        })

        it('sheet missing', async function () {
            const filename = path.resolve(testData, './analyze/test5.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
            config.worksheet = 'missing'
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert.throws(() => { throw errors[0] }, Errors.SheetMissing)
        })

        it('inconsistent sheet name', async function () {
            const filename = path.resolve(testData, './analyze/test5.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
            config.worksheet = 'Tabelle1'
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert.throws(() => { throw errors[0] }, Errors.InconsistentSheetName)
        })

        it('incorrect row offset', async function () {
            const filename = path.resolve(testData, './analyze/test5.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
            config.rowOffset = 0
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert.throws(() => { throw errors[0] }, Errors.IncorrectRowOffset)
        })

        it('incorrect column index', async function () {
            const filename = path.resolve(testData, './analyze/test5.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
            config.columnHeaders = [
                ['value', 'type']
            ]
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert.throws(() => { throw errors[0] }, Errors.IncorrectColumnIndex)
        })

        it('missing data header', async function () {
            const filename = path.resolve(testData, './analyze/test5.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
            config.columnHeaders[0][0] = 'missing'
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert.throws(() => { throw errors[0] }, Errors.MissingDataHeader)
        })

        it('data header not in config', async function () {
            const filename = path.resolve(testData, './analyze/test5.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/test5Config.js')))
            config.columnHeaders[0][0] = 'missing'
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            //assert(errors[1] instanceof Errors.DataHeaderNotInConfig)
            assert.throws(() => { throw errors[1] }, Errors.DataHeaderNotInConfig)
        })

        it('invalid data', async function () {
            const filename = path.resolve(testData, './analyze/test6.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/test6Config.js')))
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert.throws(() => { throw errors[0] }, Errors.InvalidData)
        })

        it('test a valid file', async function () {
            const filename = path.resolve(testData, './analyze/test7.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/tpk-daten-config.js')))
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert(!errors.length)
        })

        it('test an invalid file', async function () {
            const filename = path.resolve(testData, './analyze/tpk-daten 2022-08-01.xlsx')
            const config = Object.assign({}, require(path.resolve(testData, './analyze/tpk-daten-config.js')))
            const errors = await validate(filename, config)
            //console.table(errors, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
            assert(errors.length)
        })

    })

    describe('adapt()', function () {

        it('config invalid')

        it('adapt a single config', async function () {
            const file1 = path.resolve(testData, './analyze/tpk-daten 2022-08-01.xlsx')
            const config1 = Object.assign({}, require(path.resolve(testData, './analyze/tpk-daten-config.js')))
            const errors1 = await validate(file1, config1)
            const adaption1 = await adapt(config1, errors1)
            assert.strictEqual(adaption1.rowOffset, 0)
        })

        it('adapt a multi config', async function () {
            const file2 = path.resolve(testData, './analyze/WISAG Masterlayout 2022.xlsx')
            const config2 = Object.assign({}, require(path.resolve(testData, './analyze/wisagMasterConfig.js')))
            const errors2 = await validate(file2, config2)
            const adaption2 = await adapt(config2, errors2)
            console.table(errors2, ['name', 'worksheet', 'key', 'header', 'index', 'actual'])
        
            for (const key in adaption2) {
                const subConf = adaption2[key]
                console.log({ key, subConf })
                const tData = subConf.columns ? subConf.columns : subConf.fields
                console.table(tData)
            }

        })

    })

})