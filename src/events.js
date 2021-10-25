const path = require('path')
const Fuse = require('fuse.js')
const { getEventsData } = require('./database.js')

function isEventFolder(filename) {
    const eventFolder = /[\\\/]\d{4}[\\\/](eigenveranstaltung|ge2 kongresse|ge3 gast|interne vas|filmdreharbeiten|palais)[\\\/][a-z\s\d\-\(\)\.]+/i
    return eventFolder.test(filename)
}

/**
 * Return an events folder name
 * @param {String} filename name of the file including path
 * @returns 
 */
function eventFolderName(filename) {
    const parts = filename.split(path.sep)
    const isYear = /\d{4}/
    for (let pCnt = 0; pCnt < parts.length; pCnt++) {
        const part = parts[pCnt]
        if (isYear.test(part)) {
            return parts[pCnt + 2]
        }
    }
    return undefined
}

async function searchEvent(keyword) {
    // load data
    const eventsData = await getEventsData()
    const options = {
        // isCaseSensitive: false,
        includeScore: true,
        // shouldSort: true,
        includeMatches: true,
        // findAllMatches: false,
        minMatchCharLength: 1,
        // location: 0,
        // threshold: 0.6,
        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        keys: [
            'matchcode',
            'title'
        ]
    }

    const fuse = new Fuse(eventsData, options)

    return fuse.search(keyword)
}

module.exports = {
    isEventFolder,
    eventFolderName,
    searchEvent
}