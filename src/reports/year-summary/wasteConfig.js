const wasteConfig = {
    "worksheet": "sheet 1",
    "type": "list",
    "rowOffset": 5,
    "columns": [
        { "index": 1, "key": "date", "mapper": value => new Date(value) },
        { "index": 4, "key": "type" },
        { "index": 5, "key": "weight", "mapper": value => Number(value) },
        { "index": 7, "key": "price", "mapper": value => Number(value) }
    ]
}


module.exports = wasteConfig