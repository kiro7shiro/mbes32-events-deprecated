const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { list, Errors } = require('../src/list.js')

const testData = path.resolve(__dirname, './testData')

// robust functions to verify the tests
const findAll = function (start) {
    const result = []
    const absolute = path.resolve(start)
    const stat = fs.statSync(absolute)
    if (stat.isDirectory()) {
        const items = fs.readdirSync(absolute)
        for (let iCnt = 0; iCnt < items.length; iCnt++) {
            const newStart = path.resolve(start, items[iCnt])
            result.push(...findAll(newStart))
        }
    } else {
        result.push(start)
    }
    return result
}
const allFiles = findAll(testData)
const jsFiles = allFiles.filter(function (file) {
    return /\.js\b/i.test(file)
})
const jsonFiles = allFiles.filter(function (file) {
    return /\.json\b/i.test(file)
})
const xlsxFiles = allFiles.filter(function (file) {
    return /\.xlsx\b/i.test(file)
})
const findDirs = function (start) {
    const result = []
    const absolute = path.resolve(start)
    const stat = fs.statSync(absolute)
    if (stat.isDirectory()) {
        result.push(absolute)
        const items = fs.readdirSync(absolute)
        for (let iCnt = 0; iCnt < items.length; iCnt++) {
            const newStart = path.resolve(start, items[iCnt])
            result.push(...findDirs(newStart))
        }
    }
    return result
}
const allDirs = findDirs(testData)

describe('list()', function () {

    it(`start not exists`, async function () {
        await assert.rejects(list(testData + '!'), Errors.StartNotExists)
    })

    it('list all files', async function () {
        const testAllFiles = await list(testData)
        assert.strictEqual(testAllFiles.length, allFiles.length)
    })

    it('list *.js file(s)', async function () {
        const testJsFiles = await list(testData, {
            matchers: [/\.js\b/i]
        })
        assert.strictEqual(testJsFiles.length, jsFiles.length)
    })

    it('list *.json file(s)', async function () {
        const testJsonFiles = await list(testData, {
            matchers: [/\.json\b/i]
        })
        assert.strictEqual(testJsonFiles.length, jsonFiles.length)
    })

    it('list *.xlsx file(s)', async function () {
        const testXlsxFiles = await list(testData, {
            matchers: [/\.xlsx\b/i]
        })
        assert.strictEqual(testXlsxFiles.length, xlsxFiles.length)
    })

    it('list all dirs', async function () {
        const dirs = await list(testData, {
            recurse: false,
            dirs: true
        })
        assert.strictEqual(dirs.length, allDirs.length - 1)
    })

})