const fs = require('fs')
const path = require('path')
const term = require('terminal-kit').terminal
const { list, render, parse } = require('reporter')
const settings = require('../../../settings.json')

async function createDatabase(tpkFolder) {
    term('please enter a database filename:\n')
    const newFilename = path.parse(path.resolve(tpkFolder, (await term.inputField().promise)))
    // auto select file creation by filename extension
    switch (newFilename.ext) {  
        case '.json':
            fs.writeFileSync(path.format(newFilename), JSON.stringify([], null, 4))
            break

        case '.xlsx':
            const newFile = await render(`${settings['reports-folder']}/tpk-database/tpk-database-template.xlsx`, [])
            await newFile.xlsx.writeFile(path.format(newFilename))
            break

        default:
            throw new Error(`${newFilename.ext} not supported.`)
    }
    return newFilename
}

module.exports = async function eventsDatabase() {
    
    // 1. show options
        // add file(s) to database
        // create database

    // make a new database file
    // update a existing database file with new data
    // asking for new data

    const start = settings['events-folder']
    const [tpkFolder] = list(start, { matchers: [/tpk-daten/i], dirs: true, recurse: false })

    if (!tpkFolder) throw new Error(`Can't find tpk-data folder.`)

    // show menu
    const menuOpts = ['add file(s)', 'create database']
    const input = await term.singleColumnMenu(menuOpts).promise
    
    switch (input.selectedText) {
        case 'add file(s)':

            // check if database file is present create one if needed
            const oldFilename = settings['events-database']
            let filename = ''
            if (!oldFilename) {
                term('\nno database file found. would you like to create one?\n')
                const answers = await term.singleColumnMenu(['yes', 'no']).promise
                if (answers.selectedText === 'no') break
                const tpkDataFiles = list(tpkFolder, { matchers: [/\.json\b|\.xlsx\b/i], recurse: false })
                if (!tpkDataFiles.length) {
                    filename  =  path.format(await createDatabase(tpkFolder))
                    // save filename to settings
                    settings['events-database'] = filename
                    fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 4))
                }else{
                    filename = tpkDataFiles[0]
                }
            }else{
                filename = oldFilename
            }
            const databaseFile = path.parse(filename)

            // 1. ask for new file(s) location or use standard path and check if new file(s) where added
            term('\nplease enter location of new file(s): ')
            const newFiles = await term.inputField().promise

            // 2. import data from file(s)
            
            
            // 3. add data to database file

            break

        case 'create database':
            const newFilename = await createDatabase(tpkFolder)
            // save filename to settings
            settings['events-database'] = path.format(filename)
            fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 4))

            term('\nfile saved as:').green(path.format(filename))('\n')
            break

    }    
    
    
}