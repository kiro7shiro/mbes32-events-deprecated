const assert = require('assert')
const path = require('path')
const { render, Errors } = require('../src/render.js')

const testData = path.resolve(__dirname, './testData')

describe('render()', function () {

    it('data file not exists', async function () {
        await assert.rejects(render(JSON.stringify, '*.json'), Errors.DataFileNotExists)
    })

    it('cannot load data', async function () {
        const test = function () {}
        await assert.rejects(render(JSON.stringify, test), Errors.CannotLoadData)
    })

    it('template not exists', async function () {
        await assert.rejects(render('*.xlsx', {}), Errors.TemplateNotExists)
    })

    it('template invalid', async function () {
        const temp = path.resolve(testData, './Dir4/invalidTemplate.txt')
        await assert.rejects(render(temp, {}), Errors.TemplateInvalid)
    })

    it('render an object into a string', async function () {
        const data = { test: 'test4' }
        const test = await render(JSON.stringify, data)
        assert.strictEqual(test, '{"test":"test4"}')
    })

    it('render data into an excel file', async function () {
        const data = [
            { key: 'test', value: '1' },
            { key: 'test', value: '2' },
            { key: 'test', value: '3' }
        ]
        const temp = path.resolve(testData, './Dir4/testTemplate.xlsx')
        const out = path.resolve(testData, './Dir4/test4.xlsx')
        const test = await render(temp, { data })
        await assert.doesNotReject(test.xlsx.writeFile(out))
        // TODO : read back the data to finish the test
    })

})