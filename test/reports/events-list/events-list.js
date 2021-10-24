const fs = require('fs')
const path = require('path')
const term = require('terminal-kit').terminal
const { parse } = require('../../../src/parse.js')
const { render } = require('../../../src/render.js')

function JSDateToExcelDate(inDate) {

    var returnDateTime = 25569.0 + ((inDate.getTime() - (inDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
    return returnDateTime.toString().substr(0,5);

}

module.exports = async function eventsList(settings) {

    // import data from database
    const databaseConfig = await parse(path.resolve('./test/reports/database/database-config.js'))
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
                /* const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
                event['internal-build-up'] = event['internal-build-up'].toLocaleDateString('de-DE', options)
                event['external-build-up'] = event['external-build-up'].toLocaleDateString('de-DE', options)
                event['event-from'] = event['event-from'].toLocaleDateString('de-DE', options)
                event['event-to'] = event['event-to'].toLocaleDateString('de-DE', options)
                event['external-dismantling'] = event['external-dismantling'].toLocaleDateString('de-DE', options)
                event['internal-dismantling'] = event['internal-dismantling'].toLocaleDateString('de-DE', options) */
                event['internal-build-up'] = Number(JSDateToExcelDate(event['internal-build-up']))

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