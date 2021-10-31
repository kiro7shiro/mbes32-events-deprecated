const fs = require('fs')
const { Command } = require('commander')
const term = require('terminal-kit').terminal
const settings = require('../settings.json')
const path = require('path')

const program = new Command

async function check() {
    for (const key in settings) {
        // currently all checks are of the same type
        const value = settings[key]
        const check = fs.existsSync(value)
        if (!check) {
            term('setting: ').red.bold(`${key} `).red(` doesn't exists.\n`)
            term('do you want to repair it?')
            const yesNo = await term.singleColumnMenu(['yes', 'no']).promise
            if (yesNo.selectedText === 'no') continue
            term('please enter a location or choose current directory\n')
            const selection = await term.singleColumnMenu(['current directory', 'enter location']).promise
            if (selection.selectedText === 'current directory') {
                settings[key] = process.cwd()
            }else{
                term('\n? ')
                const location = await term.inputField().promise
                settings[key] = path.resolve(location)
            }
        }
    }
    term('\n')
    const filename = path.resolve(__dirname, '../settings.json')
    fs.writeFileSync(filename, JSON.stringify(settings, null, 4))
}

program
    .version('0.0.1')
    .description('MBES32 event managing tool')
    .command('report', 'make an events report')
    .command('settings', 'set or get program settings')

module.exports = {
    cli: async function (args) {
        await check()
        args[1] = __filename // workaround for subcommands
        program.parse(args)
    }
}