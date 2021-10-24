const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const term = require('terminal-kit').terminal
const settings = require('../settings.json')

const program = new Command

program
    .command('list [key]', { isDefault: true })
    .description('list key value pair(s)')
    .action(name => {
        if (name && (name in settings)) {
            term(` ${name}:`).green(` ${settings[name]}\n`)
            return
        }else if (name && !(name in settings)) {
            term.red(` key: `).red.bold(`${ name}`).red(` is not in settings\n`)
            return
        }
        for (const key in settings) {
            const value = settings[key]
            term(` ${key}:`).green(` ${value}\n`)
        }
        return
    })

program
    .command('set <key> <value>')
    .description('set a key value pair in settings')
    .action((name, value) => {
        if (!(name in settings)) {
            term.red(` key: `).red.bold(`${ name}`).red(` is not in settings\n`)
            return
        }
        settings[name] = value
        fs.writeFileSync(path.resolve(__dirname, '../settings.json'), JSON.stringify(settings, null, 4))
    })

program.parse()