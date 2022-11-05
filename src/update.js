const fs = require('fs')
const path = require('path')
const { parse } = require('./parse.js')
const { render } = require('./render.js')

/**
 * Update a file with source data of (an)other file(s).
 * @param {String} target filepath of the target
 * @param {String} source filepath of the source could be a list of files saved as a *.json file
 * @param {Object} [options]
 * @param {Object} [options.importer] holds the config for importing data
 * @param {Object} [options.importer.target] configuration for target file 
 * @param {Object} [options.importer.source] configuration for source file
 * @param {Function|String} [options.updater] function to update data
 * @param {Function|String} [options.exporter] config for exporting data
 */
async function update(target, source, { importer = {}, updater, exporter } = {}) {

    if (typeof importer === 'string') importer = await parse(importer)
    if (!updater) {
        updater = Object.assign
    }else{
        updater = await parse(updater)
    }
    if (!exporter) exporter = JSON.stringify

    const targetFile = path.parse(path.resolve(target))
    const sourceData = await parse(source, { config: importer.source })
    let targetData = await parse(target, { config: importer.target })

    targetData = updater(targetData, sourceData)

    const result = await render(exporter, { data: targetData })

    switch (true) {
        case typeof result === 'string':
            fs.writeFileSync(path.format(targetFile), result)
            break

        case typeof result === 'object':
            // TODO : make any *.xlsx object type check
            await result.xlsx.writeFile(path.format(targetFile))
            break
    }

    const resultData = await parse(target, { config: importer.target })

    return resultData

}

module.exports = { update }