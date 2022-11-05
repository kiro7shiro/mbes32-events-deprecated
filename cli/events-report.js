const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const term = require('terminal-kit').terminal
const { list } = require('../src/list.js')
const { parse } = require('../src/parse.js')
const settings = require('../settings.json')

const program = new Command

program
    .argument('[name]', 'Name of the report to execute.')
    .description('make an events report')
    .action(async function (name) {

        const start = path.resolve(`${settings['reports-folder']}`)
        const reportsList = await list(start, { dirs: true, recurse: false })
        const reports = {}
        for (let pCnt = 0; pCnt < reportsList.length; pCnt++) {
            const reportPath = reportsList[pCnt]
            const reportName = path.basename(reportPath)
            const reportFile = path.resolve(reportPath, reportName + '.js')
            reports[reportName] = await parse(reportFile)
        }
        if (!name) {
            term('Please select a report: \n')
            const input = await term.singleColumnMenu(Object.keys(reports)).promise
            term(`\nstarting report: `).green(input.selectedText)(' ...\n')
            await reports[input.selectedText](settings)
        } else {
            if (!Object.keys(reports).includes(name)) throw new Error(`Report "${name}" not present.`)
            term(`\nstarting report: `).green(name)(' ...\n')
            await reports[name](settings)
        }

        term.processExit(0)

    })

program.parse()