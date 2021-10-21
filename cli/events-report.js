const path = require('path')
const term = require('terminal-kit').terminal
const { parse } = require('../src/parse.js')
const settings = require('../settings.json')

async function reporter() {

    term.clear()
    term.green(`#`)(` events-reporter\n`)

    const start = settings['reports-folder']
    const reportsList = list(start, { dirs: true, recurse: false })
    const reports = {}
    const autoComplete = []
    for (let rCnt = 0; rCnt < reportsList.length; rCnt++) {
        const report = reportsList[rCnt]
        const name = path.basename(report)
        const file = `${report}/${name}.js`
        reports[name] = await parse(file)
        autoComplete.push(name)
    }

    term('Please enter a report name: ')

    const input = await term.inputField(
        {
            autoComplete,
            autoCompleteHint: true,
            autoCompleteMenu: true
        }
    ).promise
    term(`\nstarting report: `).green(input)(' ...\n')
    await reports[input]()
    term.processExit()

}

reporter()