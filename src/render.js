const fs = require('fs')
const path = require('path')
const { Renderer } = require('xlsx-renderer')

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

class Errors {
    static CannotRenderFile = CannotRenderFile
    static DataFileNotExists = DataFileNotExists
    static CannotLoadData = CannotLoadData
    static TemplateNotExists = TemplateNotExists
    static TemplateInvalid = TemplateInvalid
}

/**
 * Render data into a human readable format or file.
 * @param {String|Function} template for rendering data into a string
 * @param {Boolean|Number|String|Object} data object or path to a file
 * @returns {String|Object} rendered data
 */
async function render(template, data) {

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
            const dataStr = JSON.stringify(data) || typeof data
            throw new CannotLoadData(dataStr)
    }

    // render template
    switch (true) {
        case typeof template === 'function':
            result = template(loaded)
            break

        case typeof template === 'string':
            const tempFile = path.resolve(template)
            if (!fs.existsSync(tempFile))
                throw new TemplateNotExists(tempFile)
            if (path.extname(tempFile) !== '.js' && path.extname(tempFile) !== '.xlsx') {
                throw new TemplateInvalid(tempFile)
            }
            let renderer = undefined
            if (path.extname(tempFile) === '.js') {
                renderer = require(tempFile)
                result = render(renderer, loaded)
            } else {
                renderer = new Renderer
                result = await renderer.renderFromFile(tempFile, loaded)
            }
            break

        default:
            throw new TemplateInvalid(template)

    }

    return result

}

module.exports = { render, Errors }