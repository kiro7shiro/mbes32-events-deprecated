const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const term = require('terminal-kit').terminal
const settingsPath = path.resolve(__dirname, '../settings.json')
const settings = require(settingsPath)

const program = new Command

program
    .argument('name')
    .argument('value')
    .description('set a key value pair')
    .action(function (name, value) {
        term('\n')
        if (name && (name in settings)) {
            settings[name] = value
            term(` updated key: `).green(`${name}`).white(` and value: `).yellow(`${settings[name]}\n`)            
        } else if (name && !(name in settings)) {
            settings[name] = value
            term(` added key: `).green(`${name}`).white(` and value: `).yellow(`${settings[name]}\n`)
        }
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4))
        term('\n')
        return
    })

program.parse()