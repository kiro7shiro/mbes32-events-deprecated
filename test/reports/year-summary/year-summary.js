const path = require('path')
const { list, parse, render, validate } = require('reporter')
const term = require('terminal-kit').terminal
const settings = require('../../../settings.json')
const billConfig = require('./billConfig')

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
module.exports = async function yearSummary() {
    /* 
       // TODO : copy data from source
        ? save subcontractor enums
            ? names
            ? regex matchers for files or folders
        TODO : create database
            - save events            
        TODO : select subcontractor
        TODO : select event
        TODO : sort files
    */

    const logger = []
    const start = settings['events-folder']
    const years = list(start, { dirs: true, recurse: false }).map(year => path.basename(year))

    term('\nPlease select a year: ')

    const input = await term.singleColumnMenu(years).promise
    term(`\nYou've selected: `).green(input.selectedText)(' ...\n')

    await term.spinner()
    term(' listing files, please wait ...\n')

    // adjust config for each subcontractor
    const newlineConfig = JSON.parse(JSON.stringify(billConfig))
    const sasseConfig = JSON.parse(JSON.stringify(billConfig))
    const wisagConfig = JSON.parse(JSON.stringify(billConfig))
    sasseConfig.halls.rowOffset = 15
    sasseConfig.traffics.rowOffset = 13
    sasseConfig.sanitary.rowOffset = 15
    wisagConfig.halls.rowOffset = 14
    wisagConfig.traffics.rowOffset = 12
    wisagConfig.sanitary.rowOffset = 15

    // TODO : adjust config for each file use validate
    const billsNewline = list(`${start}/${input.selectedText}`, { matchers: [/nl|newline/i, /(ab)rechnung/i, /\.xlsx\b/i] })
        .map(filename => { return { filename, config: newlineConfig } })
    const billsSasse = list(`${start}/${input.selectedText}`, { matchers: [/sasse/i, /(ab)rechnung/i, /\.xlsx\b/i] })
        .map(filename => { return { filename, config: sasseConfig } })
    const billsWisag = list(`${start}/${input.selectedText}`, { matchers: [/wisag/i, /(ab)rechnung/i, /\.xlsx\b/i] })
        .map(filename => { return { filename, config: wisagConfig } })

    const files = [...billsNewline, ...billsSasse, ...billsWisag]

    term('found ').green(files.length)(' files...\n')

    const progressBar = term.progressBar({
        title: 'parsing files : ',
        eta: true,
        percent: true,
        syncMode: true
    })

    const data = []

    for (let fCnt = 0; fCnt < files.length; fCnt++) {
        const { filename, config } = files[fCnt] || {}
        if (filename) {
            try {
                const fileData = await parse(filename, { config })
                data.push(fileData)
            } catch (error) {
                logger.push({ filename, error: error.toString(), stack: error.stack })
            }
        }
        progressBar.update(normalize(fCnt, { max: files.length }))
    }

    progressBar.stop()
    term('\n')

    const summary = []

    for (let dCnt = 0; dCnt < data.length; dCnt++) {
        const fileData = data[dCnt]
        const { filename } = files[dCnt]
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

    const reportsFolder = settings['reports-folder']
    const template = `${reportsFolder}/year-summary/year-summary-template.xlsx`
    const exported = await render(template, { data: summary })
    await exported.xlsx.writeFile(`${reportsFolder}/year-summary.xlsx`)

    if (logger.length) console.log({ logger })

    term('file saved...\n')

    return

}