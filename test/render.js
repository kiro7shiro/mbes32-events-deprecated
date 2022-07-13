const assert = require('assert')
const path = require('path')
const { render } = require('../src/render.js')

describe('render', function () {
    it('should render an object into a string', async function () {
        const data = { test: 'test4' }
        const test1 = await render(JSON.stringify, data)
        assert.equal(test1, '{"test":"test4"}')
    })
    it('should render data into an excel file', async function () {
        const data = [
            { key: 'test', value: '1' },
            { key: 'test', value: '2' },
            { key: 'test', value: '3' }
        ]
        const temp = path.resolve(process.cwd(), './test/testData/Dir4/testTemplate.xlsx')
        const test = await render(temp, { data })
        const out = path.resolve(process.cwd(), './test/testData/Dir4/test4.xlsx')
        await test.xlsx.writeFile(out)
    })
})