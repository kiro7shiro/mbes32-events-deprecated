// events report tpk-list
// enter a year? >
// enter a month? >
const fs = require('fs')
const path = require('path')
const term = require('terminal-kit').terminal
const { list } = require('reporter')
const settings = require('../../../settings.json')

module.exports = async function tpkList() {

    const start = settings['events-folder']
    const [tpkFolder] = list(start, { matchers: [/tpk-daten/i], dirs: true, recurse: false })

    if (!tpkFolder) throw new Error(`Can't find tpk-data folder.`)

    const years = list(tpkFolder, { dirs: true, recurse: false }).map(year => path.basename(year))
    years.unshift('actual')

    term('\nPlease make a choice: ')

    const { selectedText: input } = await term.singleColumnMenu(years).promise
    term(`\nYou've selected: `).green(input)(' ...\n')

    let files = undefined

    if (input === 'actual') {
        // making an actual tpk list for date.now()
        const now = new Date()
        const yearNow = now.getFullYear()
        const monthNow = now.getMonth()

        files = list(`${tpkFolder}/${yearNow}`, { matchers: [/\.xlsx\b|\.xlsm\b/i] })

        files.filter(function (file) {
            const stats = fs.statSync(file)
            console.log({ file, stats })
        })

    } else {
        // list available months for selected year
    }

}