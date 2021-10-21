const FS = require('fs')
const PATH = require('path')
const { parse } = require('./parse.js')
const { render } = require('./render.js')

/**
 * Update a file with source data of another file.
 * @param {String} target filepath of the target
 * @param {String} source filepath of the source could be a list of files saved as a *.json file
 * @param {Object} [options]
 * @param {Object} [options.importer] holds the config for importing data
 * @param {Object} [options.importer.target] configuration for target file 
 * @param {Object} [options.importer.source] configuration for source file
 * @param {Function} [options.updater] function to update data
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

    //console.log({ target, source, importer, updater, exporter })

    const targetFile = PATH.parse(PATH.resolve(target))
    const sourceData = await parse(source, { config: importer.source })
    let targetData = await parse(target, { config: importer.target })

    targetData = updater(targetData, sourceData)

    //console.log({ targetFile, targetData, sourceData })

    const result = await render(exporter, { data: targetData })

    switch (true) {
        case typeof result === 'string':
            FS.writeFileSync(PATH.format(targetFile), result)
            break

        case typeof result === 'object':
            await result.xlsx.writeFile(PATH.format(targetFile))
            break
    }

    const resultData = await parse(target, { config: importer.target })

    return resultData

}

module.exports = { update }