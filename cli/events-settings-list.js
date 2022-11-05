const { Command } = require('commander')
const term = require('terminal-kit').terminal
const path = require('path')
const settingsPath = path.resolve(__dirname, '../settings.json')
const settings = require(settingsPath)

const program = new Command

program
    .argument('[name]') // TODO : regexp for searching settings
    .description('list key value pair(s)')
    .action(function (name) {
        term('\n')
        if (name && (name in settings)) {
            term(` ${name}:`).green(` ${settings[name]}\n`)
            return
        } else if (name && !(name in settings)) {
            term.red(` key: `).red.bold(`${name}`).red(` is not in settings\n`)   
            return
        }
        for (const key in settings) {
            const value = settings[key]
            term(` ${key}:`).green(` ${value}\n`)
        }
        term('\n')
        return
    })

program.parse()
