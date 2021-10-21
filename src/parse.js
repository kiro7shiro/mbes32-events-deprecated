const PATH = require('path')
const { ImporterFactory } = require('xlsx-import/lib/ImporterFactory')
const { validate, validateConfig, validateMultiConfig } = require('./analyze.js')

/**
 * Parse a file into a data object. 
 * @param {String} filename Filename or an array of filenames saved as *.json.
 * @param {Object} config Configuration for parsing excel files.
 * @returns {Object} parsed data
 */
async function parse(filename, { config } = {}) {

    const fileData = PATH.parse(PATH.resolve(filename))
    let data = undefined

    switch (fileData.ext) {
        case '.js':
        case '.json':
            const tempData = require(PATH.format(fileData))
            if (Array.isArray(tempData)) {
                data = []
                for (let fCnt = 0; fCnt < tempData.length; fCnt++) {
                    const fl = tempData[fCnt]
                    data.push(await parse(fl, { config }))
                }
            } else {
                data = tempData
            }
            break

        case '.xlsx':
        case '.xlsm':
            if (typeof config === 'string') config = await parse(config)
            const isConfig = validateConfig(config)
            const isMultiConfig = validateMultiConfig(config)
            if (!isConfig && !isMultiConfig) {
                throw new Error(`cannot parse ${filename}, config is invalid.`)
            }
            // TODO : validate files
            const factory = new ImporterFactory
            const importer = await factory.from(PATH.format(fileData))
            if (isMultiConfig) {
                const tempData = {}
                for (const key in config) {
                    tempData[key] = importer.getAllItems(config[key])
                }
                data = tempData
            } else {
                data = importer.getAllItems(config)
            }
            break

        default:
            throw new Error(`cannot parse ${PATH.format(fileData)}`)

    }

    return data

}

module.exports = { parse }