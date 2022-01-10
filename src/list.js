const fs = require('fs')
const path = require('path')

class StartNotExistsError extends Error {
    constructor(start) {
        super(`File or Folder: '${start}' doesn't seem to exists. Please check your starting location and try again.`)
        this.name = 'StartNotExists'
    }
}

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
    if (!fs.existsSync(path.resolve(start))) throw new StartNotExistsError(start)
    // start search
    const files = []
    const dir = fs.readdirSync(start)
    for (let iCnt = 0; iCnt < dir.length; iCnt++) {
        const file = path.resolve(start, dir[iCnt])
        let stat = fs.statSync(file)
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

/**
 * List all items that the matchers have hit.
 * @param {String} start location from where to start the search
 * @returns {String[]}
 */
function listAsync(start, { matchers = [], recurse = true, dirs = false } = {}) {

    /**
     * Packs listAsync() calls for recursion.
     * @param {String} absolute path of items to pack
     * @returns {Promise[]}
     */
    async function packPromises(absolute) {
        const dir = await fs.promises.readdir(absolute)
        const promises = dir.reduce(function (prev, curr) {
            prev.push(listAsync(path.resolve(absolute, curr), { matchers, recurse, dirs }))
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
            reject(new StartNotExistsError(start))
        }
        const stat = await fs.promises.stat(absolute)
        switch (true) {
            case stat.isDirectory() && recurse && !dirs:
                const promises = await packPromises(absolute)
                const results = await Promise.all(promises)
                files.push(...results.flat())
                break
            default:
                if (stat.isDirectory() && dirs) {
                    files.push(start)
                    if (recurse) {
                        const promises = await packPromises(absolute)
                        const results = await Promise.all(promises)
                        files.push(...results.flat())
                    }
                }else if (stat.isFile() && !dirs) {
                    files.push(start)
                }
                break
        }
        let result = files
        if (matchers.length) {
            for (let mCnt = 0; mCnt < matchers.length; mCnt++) {
                const matcher = matchers[mCnt]
                result = result.filter(item => matcher.test(item))
            }
        }
        resolve(result)
    })
}

module.exports = { list, listAsync }