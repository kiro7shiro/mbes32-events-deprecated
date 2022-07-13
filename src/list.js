const fs = require('fs')
const path = require('path')

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

class StartNotExistsError extends Error {
    constructor(start) {
        super(`File or Folder: '${start}' doesn't seem to exists. Please check your starting location and try again.`)
        this.name = 'StartNotExists'
    }
}

/**
 * List all items that the matchers have hit.
 * @param {String} start location from where to start the search
 * @returns {String[]}
 */
function list(start, { matchers = [], recurse = true, dirs = false } = {}) {

    /**
     * Packs list() calls into an array for recursion.
     * @param {String} absolute path of items to pack
     * @returns {Promise[]}
     */
    async function packPromises(absolute) {
        const dir = await fs.promises.readdir(absolute)
        const promises = dir.reduce(function (prev, curr) {
            prev.push(list(path.resolve(absolute, curr), { matchers, recurse, dirs }))
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
            temp = files.filter(function (item) {
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

module.exports = { list }