const fs = require('fs')
const path = require('path')
const term = require('terminal-kit').terminal
const { list } = require('../src/list.js')
const { parse } = require('../src/parse.js')
const settings = require('../settings.json')

async function reporter() {

    term.green(`#`)(` reports:\n`)

    const start = path.resolve(`${settings['reports-folder']}`)
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

    term('Please select a report: \n')

    const input = await term.singleColumnMenu(menuItems).promise
    term(`\nstarting report: `).green(input.selectedText)(' ...\n')
    await reports[input.selectedText](settings)
    fs.writeFileSync(path.resolve(__dirname, '../settings.json'), JSON.stringify(settings, null, 4))
    term.processExit()

}

reporter()