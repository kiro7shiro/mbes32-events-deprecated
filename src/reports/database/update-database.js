function deflate(source) {
    result = []
    for (let sCnt = 0; sCnt < source.length; sCnt++) {
        const element = source[sCnt]
        if (Array.isArray(element)) {
            result.push(...element)
        } else {
            result.push(element)
        }
    }
    return result
}

function updateDatabase(target, source) {

    source = deflate(source)

    for (let sCnt = 0; sCnt < source.length; sCnt++) {
        const srcEvent = source[sCnt]
        let found = false
        for (let tCnt = 0; tCnt < target.length; tCnt++) {
            const trgEvent = target[tCnt]
            if (trgEvent['matchcode'] === srcEvent['matchcode']) {
                target[tCnt] = srcEvent
                found = true
                break
            }
        }
        if (!found) target.push(srcEvent)
    }

    target = target.filter(event => event['matchcode'] !== '')

    return target
}

module.exports = updateDatabase