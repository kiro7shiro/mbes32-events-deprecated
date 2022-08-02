const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const { ImporterFactory } = require('xlsx-import/lib/ImporterFactory')
const { Renderer } = require('xlsx-renderer')
const { adapt, validate, validateConfig, validateMultiConfig } = require('./analyze.js')

/**
 * https://stackoverflow.com/questions/71737880/nodejs-filter-out-directories-async/71738685#71738685
 * @param {*} arr 
 * @param {*} predicate 
 * @returns 
 */
const asyncFilter = async function (arr, predicate) {
    const results = await Promise.all(arr.map(predicate))
    return arr.filter(function (_v, index) {
        return results[index]
    })
}

class StartNotExists extends Error {
    constructor(start) {
        super(`'${start}' doesn't seem to exists. Please check your starting location and try again.`)
        this.type = 'StartNotExists'
    }
}
class CannotParseFile extends Error {
    constructor(filename, message) {
        super(message)
        this.type = 'CannotParseFile'
        this.filename = filename
    }
}
class ConfigInvalid extends CannotParseFile {
    constructor(filename) {
        super(filename, `cannot parse ${filename} config is invalid.`)
    }
}
class UnsupportedFileFormat extends CannotParseFile {
    constructor(filename, ext) {
        super(filename, `cannot parse ${filename} unsupported file format *.${ext}.`)
        this.ext = ext
    }
}
class CannotRenderFile extends Error {
    constructor(filename, message) {
        super(message)
        this.type = 'CannotRenderFile'
        this.filename = filename
    }
}
class DataFileNotExists extends CannotRenderFile {
    constructor(filename) {
        super(filename, `${path.basename(filename)} doesn't exists.`)
    }
}
class CannotLoadData extends CannotRenderFile {
    constructor(filename) {
        super(filename, `cannot load ${path.basename(filename)}.`)
    }
}
class TemplateNotExists extends CannotRenderFile {
    constructor(filename) {
        super(filename, `${path.basename(filename)} doesn't exists.`)
    }
}
class TemplateInvalid extends CannotRenderFile {
    constructor(filename) {
        super(filename, `cannot render template ${path.basename(filename)}.`)
    }
}

class FileEditor extends EventEmitter {

    static Errors = {
        StartNotExists,
        ConfigInvalid,
        UnsupportedFileFormat,
        DataFileNotExists,
        CannotLoadData,
        TemplateNotExists,
        TemplateInvalid
    }

    constructor() {
        super()
    }

    /**
     * List all items that the matchers have hit.
     * @param {String} start location from where to start the search
     * @param {Object} options
     * @param {Array} options.matchers array of regex to match with the names
     * @param {Boolean} options.recurse search nested directories
     * @param {Boolean} options.dirs return only directory names
     * @returns {String[]}
     */
    async list(start, { matchers = [], recurse = true, dirs = false } = {}) {

        const self = this

        /**
         * Packs list() calls into an array for recursion.
         * @param {String} absolute path of items to pack
         * @returns {Promise[]}
         */
        async function packPromises(absolute) {
            const dir = await fs.promises.readdir(absolute)
            const promises = dir.reduce(function (prev, curr) {
                prev.push(self.list(path.resolve(absolute, curr), { matchers, recurse, dirs }))
                return prev
            }, [])
            return promises
        }

        return new Promise(async function (resolve, reject) {
            const files = []
            const absolute = path.resolve(start)
            try {
                await fs.promises.access(absolute, fs.constants.R_OK | fs.constants.W_OK)
            } catch (error) {
                reject(new StartNotExists(start))
            }
            const stat = await fs.promises.stat(absolute)
            const isDir = stat.isDirectory()
            switch (true) {
                case isDir && recurse && !dirs:
                    const promises = await packPromises(absolute)
                    const results = await Promise.all(promises)
                    files.push(...results.flat())
                    break
                default:
                    if (isDir && dirs) {
                        if (recurse) {
                            const promises = await packPromises(absolute)
                            const results = await Promise.all(promises)
                            files.push(...results.flat())
                        } else {
                            const items = await fs.promises.readdir(absolute)
                            const dir = (await asyncFilter(items, async function (item) {
                                const iStat = await fs.promises.stat(path.resolve(absolute, item))
                                return iStat.isDirectory()
                            })).map(i => path.resolve(absolute, i))
                            files.push(...dir)
                        }
                    } else if (stat.isFile() && !dirs) {
                        files.push(start)
                    }
                    break
            }
            let result = files
            if (matchers.length) {
                result = []
                let temp = files.filter(function (item) {
                    let keep = true
                    for (let mCmt = 0; mCmt < matchers.length; mCmt++) {
                        const matcher = matchers[mCmt]
                        keep = keep && matcher.test(item)
                    }
                    return keep
                })
                result.push(...temp)

            }
            resolve(result)
        })
    }

    /**
     * Parse a file into a data object. 
     * @param {String} filename Filename or an array of filenames saved as *.json file.
     * @param {Object} [options]
     * @param {Object} [options.config] Configuration for parsing excel files.
     * @returns {Object} parsed data
     */
    async parse(filename, { config } = {}) {

        const self = this
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
                        data.push(await self.parse(fl, { config }))
                    }
                } else {
                    data = tempData
                }
                break

            case '.xlsx':
            case '.xlsm':
                // parse excel files
                if (typeof config === 'string') config = await self.parse(config)
                const isConfig = validateConfig(config)
                const isMultiConfig = validateMultiConfig(config)
                if (!isConfig && !isMultiConfig) {
                    throw new ConfigInvalid(filename)
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

    /**
     * Render data into a human readable format or file.
     * @param {String|Function} template for rendering data into a string
     * @param {Boolean|Number|String|Object} data object or path to a file
     * @returns {String|Object} rendered data
     */
    async render(template, data) {

        const self = this
        let result = undefined
        let loaded = undefined

        // load data
        switch (true) {
            case typeof data === 'boolean':
            case typeof data === 'number':
            case typeof data === 'object':
                loaded = data
                break

            case typeof data === 'string' && /\.json\b/i.test(data):
                const dataFile = path.resolve(data)
                if (!fs.existsSync(dataFile))
                    throw new DataFileNotExists(dataFile)
                loaded = require(dataFile)
                break

            case typeof data === 'string':
                loaded = JSON.parse(data)
                break

            default:
                throw new CannotLoadData(data)
        }

        // render template
        switch (true) {
            case typeof template === 'function':
                result = template(loaded)
                break

            case typeof template === 'string':
                const tempFileData = path.parse(path.resolve(template))
                const tempFile = path.format(tempFileData)
                if (!fs.existsSync(tempFile))
                    throw new TemplateNotExists(tempFile)
                if (tempFileData.ext !== '.js' && tempFileData.ext !== '.xlsx') {
                    throw new TemplateInvalid(tempFile)
                }
                let renderer = undefined
                if (tempFileData.ext === '.js') {
                    renderer = require(tempFile)
                    result = self.render(renderer, loaded)
                } else {
                    renderer = new Renderer
                    result = await renderer.renderFromFile(tempFile, loaded)
                }
                break

            default:
                throw new TemplateInvalid(tempFile)

        }

        return result

    }

}

module.exports = { FileEditor }