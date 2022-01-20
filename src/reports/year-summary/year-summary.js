const util = require('util')
const path = require('path')
const { list, listAsync } = require('../../list.js')
const { render } = require('../../render.js')
const { parse } = require('../../parse.js')
const { validate } = require('../../analyze.js')
const term = require('terminal-kit').terminal
const billConfig = require('./billConfig')

const { matchers } = require('../../analyze.js')

function normalize(x, { min = 0, max = 1 } = {}) {
    return (x - min) / (max - min)
}

const summaries = {
    halls: function (sheetData) {
        if (!Array.isArray(sheetData)) throw new Error('sheetData must be an array')
        let result = Object.fromEntries([
            ['setupCleaning', 0],
            ['preCleaning', 0],
            ['nightlyCleaning40%', 0],
            ['nightlyCleaning', 0],
            ['dailyCleaning40%', 0],
            ['dailyCleaning', 0],
            ['postCleaning', 0]
        ])
        for (let sCnt = 0; sCnt < sheetData.length; sCnt++) {
            const rowData = sheetData[sCnt]
            const area = rowData['area']
            result['setupCleaning'] += area * rowData['setupCleaning']
            result['preCleaning'] += area * rowData['preCleaning']
            result['nightlyCleaning40%'] += area * rowData['nightlyCleaning40%']
            result['nightlyCleaning'] += area * rowData['nightlyCleaning']
            result['dailyCleaning40%'] += area * rowData['dailyCleaning40%']
            result['dailyCleaning'] += area * rowData['dailyCleaning']
            result['postCleaning'] += area * rowData['postCleaning']
        }
        return result
    },
    traffics: function (sheetData) {
        if (!Array.isArray(sheetData)) throw new Error('sheetData must be an array')
        let result = Object.fromEntries([
            ['setupCleaning', 0],
            ['preCleaning', 0],
            ['nightlyCleaning', 0],
            ['dailyCleaning', 0],
            ['postCleaning', 0]
        ])
        for (let sCnt = 0; sCnt < sheetData.length; sCnt++) {
            const rowData = sheetData[sCnt]
            const area = rowData['area']
            result['setupCleaning'] += area * rowData['setupCleaning']
            result['preCleaning'] += area * rowData['preCleaning']
            result['nightlyCleaning'] += area * rowData['nightlyCleaning']
            result['dailyCleaning'] += area * rowData['dailyCleaning']
            result['postCleaning'] += area * rowData['postCleaning']
        }
        return result
    },
    sanitary: function (sheetData) {
        if (!Array.isArray(sheetData)) throw new Error('sheetData must be an array')
        let result = Object.fromEntries([
            ['setupCleaning', 0],
            ['preCleaning', 0],
            ['nightlyCleaning', 0],
            ['dismantling', 0],
            ['postCleaning', 0]
        ])
        for (let sCnt = 0; sCnt < sheetData.length; sCnt++) {
            const rowData = sheetData[sCnt]
            const area = rowData['area']
            result['setupCleaning'] += area * rowData['setupCleaning']
            result['preCleaning'] += area * rowData['preCleaning']
            result['nightlyCleaning'] += area * rowData['nightlyCleaning']
            result['dismantling'] += area * rowData['dismantling']
            result['postCleaning'] += area * rowData['postCleaning']
        }
        return result
    },
    toiletService: function (sheetData) {
        if (!Array.isArray(sheetData)) throw new Error('sheetData must be an array')
        let result = Object.fromEntries([
            ['hours', 0]
        ])
        for (let sCnt = 0; sCnt < sheetData.length; sCnt++) {
            const rowData = sheetData[sCnt]
            result['hours'] += rowData['workers'] * rowData['hours'] * rowData['days']
        }
        return result
    },
    outdoor: function (sheetData) {
        if (!Array.isArray(sheetData)) throw new Error('sheetData must be an array')
        let result = Object.fromEntries([
            ['area', 0]
        ])
        for (let sCnt = 0; sCnt < sheetData.length; sCnt++) {
            const rowData = sheetData[sCnt]
            const area = rowData['area']
            result['area'] += area * rowData['hours'] * rowData['days']
        }
        return result
    },
    additionalService: function (sheetData) {
        if (!Array.isArray(sheetData)) throw new Error('sheetData must be an array')
        let result = Object.fromEntries([
            ['hours', 0]
        ])
        for (let sCnt = 0; sCnt < sheetData.length; sCnt++) {
            const rowData = sheetData[sCnt]
            result['hours'] += rowData['workers'] * rowData['hours'] * rowData['days']
        }
        return result
    }
}

/**
 * Report bill files of a year
 * 
 */
module.exports = async function yearSummary(settings) {
    /* 
        DONE : create database
        DONE : save events
        TODO : enums for file and folder matchers
        TODO : select subcontractor
        TODO : select event
        TODO : sort files
    */

    const start = settings['events-folder']
    const years = (await listAsync(start, { matchers: [matchers.yearFolder], dirs: true, recurse: false })).map(year => path.basename(year))
    term('\nPlease select a year: ')
    const input = await term.singleColumnMenu(years).promise
    term(`\nYou've selected: `).green(input.selectedText)(' ...\n')

    term('listing files, please wait ...')
    let spinner = await term.spinner()
    const files = await listAsync(`${start}${path.sep}${input.selectedText}\\Eigenveranstaltung`, { matchers: [matchers.bill, matchers.xlsx, matchers.sasse] })
    spinner.hidden = true
    term('\nfound ').green(files.length)(' files...\n')

    term('parsing files...')
    spinner = await term.spinner()
    const data = []
    for (let fCnt = 0; fCnt < files.length; fCnt++) {
        const filename = files[fCnt]
        const errors = await validate(filename, billConfig)
        const offsets = errors.filter(function (error) {
            return error.type === 'wrongOffset'
        })
        if (offsets.length) {
            for (let oCnt = 0; oCnt < offsets.length; oCnt++) {
                const offset = offsets[oCnt]
                const config = Object.values(billConfig).find(function (conf) {
                    return conf.worksheet === offset.worksheet
                })
                config.rowOffset = offset.rowOffset
            }
        }
        let fileData
        try {
            fileData = await parse(filename, { config: billConfig })    
        } catch (error) {
            //console.error(error)
            console.log({ error: filename })
        }
        
        data.push(fileData)
    }

    const summary = []
    for (let dCnt = 0; dCnt < data.length; dCnt++) {
        const fileData = data[dCnt]
        const filename = files[dCnt]
        const fileSummary = {
            path: path.dirname(filename),
            filename: path.basename(filename)
        }
        for (const key in fileData) {
            const sheetData = fileData[key]
            if (key in summaries) {
                fileSummary[key] = summaries[key](sheetData)
            }
        }
        summary.push(fileSummary)
    }
    spinner.hidden = true

    const reportsFolder = settings['reports-folder']
    const template = `${reportsFolder}/year-summary/year-summary-template.xlsx`
    const exported = await render(template, { data: summary })
    await exported.xlsx.writeFile(`${reportsFolder}\\year-summary.xlsx`)
    term(`\nfile saved as:${reportsFolder}\\year-summary.xlsx...\n`)

    return
}