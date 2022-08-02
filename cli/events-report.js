const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const term = require('terminal-kit').terminal
const { list } = require('../src/list.js')
const { parse } = require('../src/parse.js')
const settings = require('../settings.json')

const program = new Command

program
    .description('make an events report')

program.parse()

async function reporter() {

    const start = path.resolve(`${settings['reports-folder']}`)
    const reportsList = await list(start, { dirs: true, recurse: false })
    //console.log({ reportsList })
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
    term.processExit(0)

}

reporter()