const path = require('path')
const term = require('terminal-kit').terminal
const { list } = require('../src/list.js')
const { parse } = require('../src/parse.js')
const settings = require('../settings.json')

async function reporter() {

    term.clear()
    term.green(`#`)(` events-reporter\n`)

    const start = path.resolve(settings['reports-folder'])
    const reportsList = list(start, { dirs: true, recurse: false })
    const reports = {}
    const menuItems = []
    for (let rCnt = 0; rCnt < reportsList.length; rCnt++) {
        const report = reportsList[rCnt]
        const name = path.basename(report)
        const file = `${report}/${name}.js`
        reports[name] = await parse(file)
        menuItems.push(name)
    }

    term('Please enter a report name: ')

    const input = await term.singleColumnMenu(menuItems).promise
    term(`\nstarting report: `).green(input)(' ...\n')
    await reports[input]()
    term.processExit()

}

reporter()