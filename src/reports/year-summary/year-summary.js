const fs = require('fs')
const path = require('path')
const { list } = require('../../list.js')
const { render } = require('../../render.js')
const { parse } = require('../../parse.js')
const { validate } = require('../../analyze.js')
const { matchers } = require('../../analyze.js')
const term = require('terminal-kit').terminal
const billConfig = require('./billConfig')
const wasteConfig = require('./wasteConfig')

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
            result['area'] += rowData['area'] * rowData['hours'] * rowData['days']
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

    const start = settings['events-folder']
    const years = (await list(start, { matchers: [matchers.yearFolder], dirs: true, recurse: false })).map(year => path.basename(year))
    term('\nPlease select a year: ')
    const input = await term.singleColumnMenu(years).promise
    term(`\nYou've selected: `).green(input.selectedText)(' ...\n')

    term('listing files, please wait ...')
    let spinner = await term.spinner()
    const files = await list(`${start}${path.sep}${input.selectedText}`, { matchers: [matchers.bill, matchers.xlsx] })
    spinner.hidden = true
    term('\nfound ').green(files.length)(' files...\n')

    let bar = progressBar = term.progressBar({
        width: term.width,
        title: 'parsing files ',
        eta: true,
        percent: true
    })
    const data = []
    for (let fCnt = 0; fCnt < files.length; fCnt++) {
        const filename = files[fCnt]
        // test file
        const errors = await validate(filename, billConfig)
        const offsets = errors.filter(function (error) {
            return error.type === 'incorrectRowOffset'
        })
        const noSheets = errors.filter(function (error) {
            return error.type === 'sheetMissing'
        })
        const invalidSheetNames = errors.filter(function (error) {
            return error.type === 'inconsistentSheetName'
        })
        // adapt config to file
        // TODO : use adapt() function
        const saved = []
        if (noSheets.length) {
            for (let nCnt = 0; nCnt < noSheets.length; nCnt++) {
                const noSheet = noSheets[nCnt]
                for (const key in billConfig) {
                    const config = billConfig[key]
                    if (config.worksheet === noSheet.worksheet) {
                        saved.push({ key, config })
                        delete billConfig[key]
                        break
                    }
                }
            }
        }
        if (invalidSheetNames.length) {
            for (let iCnt = 0; iCnt < invalidSheetNames.length; iCnt++) {
                const invalid = invalidSheetNames[iCnt]
                const config = Object.values(billConfig).find(function (conf) {
                    return conf.worksheet === invalid.validName
                })
                config.worksheet = invalid.worksheet
            }
        }
        if (offsets.length) {
            for (let oCnt = 0; oCnt < offsets.length; oCnt++) {
                const offset = offsets[oCnt]
                const config = Object.values(billConfig).find(function (conf) {
                    return conf.worksheet === offset.worksheet
                })
                config.rowOffset = offset.valid
            }
        }
        // import data
        let fileData
        if (!matchers.alba.test(filename) && !matchers.glass.test(filename)) {
            fileData = await parse(filename, { config: billConfig })
            data.push(fileData)
        /* } else if (matchers.alba.test(filename)) {
            fileData = await parse(filename, { config: wasteConfig })
            data.push(fileData) */
        } else {
            data.push({})
        }
        // reset config
        if (offsets.length) {
            for (let oCnt = 0; oCnt < offsets.length; oCnt++) {
                const offset = offsets[oCnt]
                const config = Object.values(billConfig).find(function (conf) {
                    return conf.worksheet === offset.worksheet
                })
                config.rowOffset = offset.valid
            }
        }
        if (invalidSheetNames.length) {
            for (let iCnt = 0; iCnt < invalidSheetNames.length; iCnt++) {
                const invalid = invalidSheetNames[iCnt]
                const config = Object.values(billConfig).find(function (conf) {
                    return conf.worksheet === invalid.worksheet
                })
                config.worksheet = invalid.validName
            }
        }
        if (saved.length) {
            for (let sCnt = 0; sCnt < saved.length; sCnt++) {
                const save = saved[sCnt]
                billConfig[save.key] = save.config
            }
        }
        bar.update(normalize(fCnt, { min: 0, max: files.length - 1 }))
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

    const reportsFolder = settings['reports-folder']
    const template = `${reportsFolder}/year-summary/year-summary-template.xlsx`
    const exported = await render(template, { data: summary })
    await exported.xlsx.writeFile(`${reportsFolder}\\year-summary.xlsx`)
    fs.writeFileSync(`${reportsFolder}/year-summary/summary.json`, JSON.stringify(summary, null, 4))
    term(`\nfile saved as:${reportsFolder}\\year-summary.xlsx...\n`)

    return
}