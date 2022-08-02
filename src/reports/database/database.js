const fs = require('fs')
const path = require('path')
const { list } = require('../../list.js')
const { render } = require('../../render.js')
const { update } = require('../../update.js')
const { validate } = require('../../analyze.js')
const terminal = require('terminal-kit').terminal

const dataFilesMatcher = /tpk-daten[\s0-9\-]+\.xlsx\b/i

module.exports = async function tpkDatabase(settings) {

    // TODO : *.json files

    // search for saved database file
    const check = fs.existsSync(settings['events-database'])
    if (!check) {

        terminal(`no database file found. would you like to create one?`)
        const newDatabase = await terminal.singleColumnMenu(['yes', 'no']).promise

        if (newDatabase.selectedText === 'no') return

        terminal(`please enter a database filename:\n`)
        const y = (await terminal.getCursorLocation())['y']
        const inputFilename = await terminal.inputField({ y, x: 2 }).promise
        const filename = path.parse(path.resolve(settings['data-folder'], inputFilename))
        const templatePath = path.parse(path.resolve(__dirname, 'database-template.xlsx'))

        const rendered = await render(path.format(templatePath), [])
        await rendered.xlsx.writeFile(path.format(filename))

        settings['events-database'] = path.format(filename)

        terminal.green(`\ndatabase saved ...\n`)

    }

    // get dataFile(s) location
    terminal(`please enter a data file(s) location:\n`)
    const y = (await terminal.getCursorLocation())['y']
    const inputDataFiles = await terminal.inputField({ y, x: 2 }).promise
    const dataFiles = path.parse(path.resolve(inputDataFiles))
    let dataStart = path.parse(path.format(dataFiles))
    let configMatcher = new RegExp(`${dataStart.name}-config.js`, 'i')
    if (dataFiles.ext) {
        dataStart = path.parse(path.dirname(path.format(dataFiles)))
        configMatcher = new RegExp(`${dataFiles.name}-config.js`, 'i')
    }
    // search config
    const configs = await list(path.format(dataStart), { matchers: [configMatcher] })
    if (!configs.length) {
        terminal.red(`\nno config found for: ${dataFiles.name}\n`)
        terminal(`please save a config and try again.\n`)
        return
    }
    // list files
    let files 
    if(dataFiles.ext) {
        files = [path.format(dataFiles)]
    }else{
        files = await list(path.format(dataStart), { matchers: [dataFilesMatcher] })
    }
    if (!files.length) {
        terminal.red(`\nno data files found.\n`)
        return
    }

    // update database
    fs.writeFileSync(`${path.format(dataStart)}/dataFiles.json`, JSON.stringify(files, null, 4))
    const sourceConfig = configs[0]
    const targetConfig = path.resolve(path.dirname(__filename), 'database-config.js')
    const updater = path.resolve(path.dirname(__filename), 'update-database.js')
    const exporter = path.resolve(path.dirname(__filename), 'database-template.xlsx')

    terminal('\n')
    await terminal.spinner()
    terminal(` updating ${path.basename(settings['events-database'])} please wait ...\n`)

    await update(
        settings['events-database'],
        `${path.format(dataStart)}/dataFiles.json`,
        {
            importer: {
                target: targetConfig,
                source: sourceConfig
            },
            updater,
            exporter
        }
    )

    terminal.green(`done\n`)

}