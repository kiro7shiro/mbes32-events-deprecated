const parseDate = function (value) {
    const [day, month, year] = value.split('.', 3).map(Number)
    return new Date(year, month - 1, day)
}

const databaseConfig = {
    "worksheet": "events",
    "type": "list",
    "rowOffset": 1,
    "columns": [
        { "index": 1, "key": "internal-build-up", mapper: parseDate },
        { "index": 2, "key": "external-build-up", mapper: parseDate },
        { "index": 3, "key": "event-from", mapper: parseDate },
        { "index": 4, "key": "event-to", mapper: parseDate },
        { "index": 5, "key": "external-dismantling", mapper: parseDate },
        { "index": 6, "key": "internal-dismantling", mapper: parseDate },
        { "index": 7, "key": "matchcode" },
        { "index": 8, "key": "title" },
        { "index": 9, "key": "comment" },
        { "index": 10, "key": "account" },
        { "index": 11, "key": "type" },
        { "index": 12, "key": "status" },
        { "index": 13, "key": "location" },
        { "index": 14, "key": "manager" },
        { "index": 15, "key": "technician" },
        { "index": 16, "key": "tpl" },
        { "index": 17, "key": "plm" },
        { "index": 18, "key": "security" },
        { "index": 19, "key": "2nd-manager" },
        { "index": 20, "key": "2nd-tpl" },
        { "index": 21, "key": "2nd-technician" },
        { "index": 22, "key": "2nd-plm" },
        { "index": 22, "key": "2nd-security" }
    ]
}

module.exports = databaseConfig