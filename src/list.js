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
 * @param {String} start location from where to start the search
 * @returns {String[]}
 */
function list(start, { matchers = [], recurse = true, dirs = false } = {}) {

    /**
     * Packs listAsync() calls into an array for recursion.
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
        switch (true) {
            case stat.isDirectory() && recurse && !dirs:
                const promises = await packPromises(absolute)
                const results = await Promise.all(promises)
                files.push(...results.flat())
                break
            default:
                if (stat.isDirectory() && dirs) {
                    if (recurse) {
                        const promises = await packPromises(absolute)
                        const results = await Promise.all(promises)
                        files.push(...results.flat())
                    } else {
                        const dir = (await fs.promises.readdir(absolute)).filter(async function (item) {
                            const iStat = await fs.promises.stat(path.resolve(absolute, item))
                            if (iStat.isDirectory()) return true
                            return false
                        }).map(i => path.resolve(absolute, i))
                        files.push(...dir)
                    }
                }else if (stat.isFile() && !dirs) {
                    files.push(start)
                }
                break
        }
        let result = files
        if (matchers.length) {
            result = []
            matchers.forEach(function (matcher) {
                temp = files.filter(function (item) {
                    return matcher.test(item)
                })
                result.push(...temp)
            })
        }
        resolve(result)
    })
}

module.exports = { listSync, list }