const path = require('path')
const { ImporterFactory } = require('xlsx-import/lib/ImporterFactory')
const { adapt, validate, validateConfig, validateMultiConfig } = require('./analyze.js')

class CannotParseFile extends Error {
    constructor(filename, message) {
        super(message)
        this.name = 'CannotParseFile'
        this.filename = filename
    }
}
class ConfigInvalid extends CannotParseFile {
    constructor(filename, errors) {
        super(filename, `cannot parse ${filename}, config is invalid.`)
        this.name = 'ConfigInvalid'
        this.errors = errors
    }
}
class UnsupportedFileFormat extends CannotParseFile {
    constructor(filename, ext) {
        super(filename, `cannot parse ${filename} unsupported file format *${ext}.`)
        this.name = 'UnsupportedFileFormat'
        this.ext = ext
    }
}

class Errors {
    static CannotParseFile = CannotParseFile
    static ConfigInvalid = ConfigInvalid
    static UnsupportedFileFormat = UnsupportedFileFormat
}

/**
 * Parse a file into a data object. 
 * @param {String} filename Filename or an array of filenames saved as *.json file.
 * @param {Object} [options]
 * @param {Object} [options.config] Configuration for parsing excel files.
 * @returns {Object} parsed object, contains either the loaded data or information's about the parsing process
 */
async function parse(filename, { config } = {}) {

    const fileData = path.parse(path.resolve(filename))
    let data = undefined

    switch (fileData.ext) {
        case '.js':
        case '.json':
            // parse an array or an object
            const tempData = require(path.format(fileData))
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
            // parse excel files
            if (typeof config === 'string') config = await parse(config)
            const isConfig = validateConfig(config)
            const isMultiConfig = validateMultiConfig(config)
            if (!isConfig && !isMultiConfig) {
                throw new ConfigInvalid(filename, [...validateConfig.errors, ...validateMultiConfig.errors])
            }
            const errors = await validate(filename, config)
            const adaption = errors.length ? adapt(config, errors) : Object.assign({}, config)
            const factory = new ImporterFactory
            const importer = await factory.from(path.format(fileData))
            if (isMultiConfig) {
                const tempData = {}
                for (const key in adaption) {
                    tempData[key] = importer.getAllItems(adaption[key])
                }
                data = tempData
            } else {
                data = importer.getAllItems(adaption)
            }
            break

        default:
            throw new UnsupportedFileFormat(filename, fileData.ext)

    }

    return data

}

module.exports = { parse, Errors }