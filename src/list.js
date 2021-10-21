const FS = require('fs')
const PATH = require('path')

/**
 * List all items that the matchers have hit.
 * @param {String} start path from where to start the search
 * @param {Object} [options]
 * @param {RegExp[]} [options.matchers] expression to match
 * @param {Boolean} [options.recurse] recursively search in subfolders, default = true
 * @param {Boolean} [options.unique] list only unique, default = true
 * @param {Boolean} [options.dirs] list only directories, default = false
 * @returns {String[]} items that the matcher has hit
 */
function list(start, { matchers, recurse = true, unique = true, dirs = false } = {}) {
    if (!FS.existsSync(PATH.resolve(start)))
        throw new Error(`Start doesn't exists: ${start}`)
    // start search
    const files = []
    const dir = FS.readdirSync(start)
    for (let iCnt = 0; iCnt < dir.length; iCnt++) {
        const file = PATH.resolve(start, dir[iCnt])
        let stat = FS.statSync(file)
        switch (true) {
            case stat.isDirectory() && recurse && !dirs:
                files.push(...list(file, { matchers, recurse, dirs }))
                break
            default:
                if ((stat.isDirectory() && dirs)) {
                    files.push(file)
                    if (recurse)
                        files.push(...list(file, { matchers, recurse, dirs }))
                } else if (!stat.isDirectory() && !dirs) {
                    files.push(file)
                }
                break
        }
    }
    // filter out hits
    let result = files
    if (matchers && matchers.length) {
        for (let mCnt = 0; mCnt < matchers.length; mCnt++) {
            const matcher = matchers[mCnt]
            result = result.filter(item => matcher.test(item))
        }
    }
    // filter only unique values
    if (unique) {
        result = result.filter((curr, index, self) => {
            let last = -1
            for (let cnt = self.length - 1; cnt >= index; cnt--) {
                const item = self[cnt]
                if (item === curr) {
                    last = cnt
                    break
                }
            }
            return index === last
        })
    }
    return result
}

module.exports = { list }