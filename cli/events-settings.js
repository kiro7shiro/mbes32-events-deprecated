const { Command } = require('commander')
const term = require('terminal-kit').terminal
const settings = require('../settings.json')

const program = new Command

program
    .command('list [name]', { isDefault: true })
    .description('list key value pair(s)')
    .action(async function (name) {
        if (name && (name in settings)) {
            term(` ${name}:`).green(` ${settings[name]}\n`)
            term.processExit()
        } else if (name && !(name in settings)) {
            term.red(` key: `).red.bold(`${name}`).red(` is not in settings\n`)
            term.processExit()
        }
        for (const key in settings) {
            const value = settings[key]
            term(` ${key}:`).green(` ${value}\n`)
        }
        term.processExit()
    })

program.parse()