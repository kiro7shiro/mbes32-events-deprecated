const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const term = require('terminal-kit').terminal
const settingsPath = path.resolve(__dirname, '../settings.json')
const settings = require(settingsPath)

const program = new Command

program
    .argument('name')
    .description('delete a key value pair')
    .action(function (name) {
        term('\n')
        if (name && (name in settings)) {
            delete settings[name]
            term(` ${name}:`).red(` deleted\n`)
        }
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4))
        term('\n')
        return
    })

program.parse()