const fs = require('fs')
const path = require('path')
const term = require('terminal-kit').terminal
const { parse } = require('../../../src/parse.js')
const { render } = require('../../../src/render.js')

function dateSerial(date) {
    if (typeof date !== 'object') return date
    const milsDay = 86400000
    const base = Math.abs(new Date(1899, 11, 30).getTime()) / milsDay
    const zoneOff = date.getTimezoneOffset() * 60 * 1000
    return base + (date.getTime() - zoneOff) / milsDay
}

module.exports = async function eventsList(settings) {

    // import data from database
    const databaseConfig = await parse(path.resolve(__dirname, '../database/database-config.js'))
    const eventsData = (await parse(settings['events-database'], { config: databaseConfig })).sort((a, b) => {
        return a['internal-build-up'] - b['internal-build-up']
    })

    // build menu options
    const years = eventsData.reduce((accu, curr) => {
        const currYear = curr['internal-build-up'].getFullYear()
        if (accu.indexOf(currYear) < 0) accu.push(currYear)
        return accu
    }, []).sort((a, b) => a - b)

    const menuOpts = ['actual quarter ...', 'enter time period ...', ...years]

    term(`please select:\n`)
    const selection = await term.singleColumnMenu(menuOpts).promise

    switch (true) {
        case selection.selectedText === 'actual quarter ...':
            const today = new Date()
            const year = today.getFullYear()
            const month = today.getMonth()
            let startQ = new Date(today.getFullYear(), month - 1, 1)
            let endQ = new Date(today.getFullYear(), month + 2, 1)
            if (month - 1 < 0) startQ = new Date(year - 1, 11, 1)
            if (month + 1 > 11) endQ = new Date(year + 1, 1, 1)
            const quarter = eventsData.filter(event => {
                const greaterStart = event['internal-build-up'] >= startQ
                const lessEnd = event['internal-dismantling'] <= endQ
                return greaterStart && lessEnd
            }).map(event => {
                event['internal-build-up'] = dateSerial(event['internal-build-up'])
                event['external-build-up'] = dateSerial(event['external-build-up'])
                event['event-from'] = dateSerial(event['event-from'])
                event['event-to'] = dateSerial(event['event-to'])
                event['external-dismantling'] = dateSerial(event['external-dismantling'])
                event['internal-dismantling'] = dateSerial(event['internal-dismantling'])
                event['internal-build-up'] = dateSerial(event['internal-build-up'])
                return event
            })
            /* console.log({
                startQ,
                endQ,
                length: quarter.length,
                '1st': quarter.slice(0,1),
                'lst': quarter.slice(-1)
            }) */
            const templatePath = path.resolve(path.dirname(__filename), 'events-list-template.xlsx')
            const list = await render(templatePath, { data: quarter })
            await list.xlsx.writeFile(`${path.resolve(path.dirname(__filename))}/events-list.xlsx`)

            break
        case selection.selectedText === 'enter time period ...':

            break
        default:

            break
    }

    return

}