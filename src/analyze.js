const path = require('path')
const Ajv = require("ajv")
const ExcelJS = require('exceljs')
const Fuse = require('fuse.js')

const sysSepMatcher = new RegExp(`\\${path.sep}`, 'i')
const pdfMatcher = /\.pdf$/i
const xlsxMatcher = /\.xlsx$|\.xlsm$/i

const yearFolderMatcher = new RegExp(`${sysSepMatcher.source}\\d{4}$`, 'i')
const eventFolderMatcher = new RegExp(
    `${yearFolderMatcher.source}${sysSepMatcher.source}(eigenveranstaltung|ge2 kongresse|ge3 gast|interne vas|filmdreharbeiten|palais)${sysSepMatcher.source}[^\\n]+`,
    'ig')

const albaMatcher = /alba/i
const cwsMatcher = /cws/i
const newlineMatcher = /nl|newline/i
const sasseMatcher = /sasse/i
const wisagMatcher = /wisag/i
const glassMatcher = /glas/i

const billMatcher = /(ab)rechnung/i
const orderMatcher = /\d{10}|bestellung/i
// plannings are a special case, we can't assume a pattern here
const planningMatcher = function (value) {
    // TODO: should return like a RegExp object
}

const matchers = {
    sysSep: sysSepMatcher,
    pdf: pdfMatcher,
    xlsx: xlsxMatcher,
    yearFolder: yearFolderMatcher,
    eventFolder: eventFolderMatcher,
    glass: glassMatcher,
    alba: albaMatcher,
    cws: cwsMatcher,
    newline: newlineMatcher,
    sasse: sasseMatcher,
    wisag: wisagMatcher,
    bill: billMatcher,
    order: orderMatcher,
    planning: planningMatcher
}

/**
 * Get the name of an es32 event folder
 * @param {String} filename 
 * @returns {String} event folder name
 */
matchers.eventFolder.getName = function getName(filename) {
    this.lastIndex = 0
    if (!this.test(filename)) return false
    this.lastIndex = 0
    const [match] = this.exec(filename)
    const parts = match.split(matchers.sysSep)
    const name = parts[parts.length - 1]
    this.lastIndex = 0
    return name
}


const columnsSchema = {
    $id: 'columns',
    type: 'array',
    minItems: 1,
    items: {
        type: 'object',
        properties: {
            index: { type: 'integer' },
            key: { type: 'string' },
            /* mapper: { type: 'object' } */
        },
        required: ['index', 'key']
    }
}

const fieldsSchema = {
    $id: 'fields',
    type: 'array',
    minItems: 1,
    items: {
        type: 'object',
        properties: {
            row: { type: 'integer' },
            col: { type: 'integer' },
            key: { type: 'string' },
            /* mapper: { type: 'object' } */
        },
        required: ['row', 'col', 'key']
    }
}

const configSchema = {
    $id: 'config',
    type: 'object',
    properties: {
        type: { type: 'string', pattern: 'list\\b|object\\b' },
        worksheet: { type: 'string', minLength: 1 },
        rowOffset: { type: 'integer' },
        columns: { $ref: 'columns' },
        fields: { $ref: 'fields' }
    },
    required: ['type', 'worksheet'],
    if: { properties: { type: { type: 'string', pattern: 'list\\b' } } },
    then: { required: ['columns'] },
    else: {
        if: { properties: { type: { type: 'string', pattern: 'object\\b' } } },
        then: { required: ['fields'] }
    },
    additionalProperties: false
}

const multiConfigSchema = {
    $id: 'multiConfig',
    type: 'object',
    minProperties: 1,
    patternProperties: {
        '^[a-z]+': { $ref: 'config' }
    }
}

const ajv = new Ajv({
    schemas: [columnsSchema, fieldsSchema, configSchema, multiConfigSchema],
    allErrors: true
})
const validateColumns = ajv.getSchema('columns')
const validateFields = ajv.getSchema('fields')
const validateConfig = ajv.getSchema('config')
const validateMultiConfig = ajv.getSchema('multiConfig')

/**
 * Validate a *.xlsx file with a configuration. Returning the differences.
 * @param {String} filename 
 * @param {String} config
 * @returns {[Object]} errors
 */
async function validate(filename, config) {

    // validate config and use the results as flags
    const validColumns = validateColumns(config)
    const validFields = validateFields(config)
    const validConfig = validateConfig(config)
    const validMultiConfig = validateMultiConfig(config)

    // test the file based on the config by trying to access the data
    let errors = []
    switch (true) {
        case !validColumns && !validFields && !validConfig && !validMultiConfig:
            throw new Error(`invalid config ...`)

        case !validColumns && !validFields && !validConfig:
            // validate a multi config
            for (const key in config) {
                const subConfig = config[key]
                errors.push(...(await validate(filename, subConfig)))
            }
            break

        case !validColumns && !validFields:
            // validate a single config
            // 1. read file
            const workbook = new ExcelJS.Workbook()
            try {
                await workbook.xlsx.readFile(filename)
            } catch (error) {
                errors.push(error)
                break
            }
            // 2. check if worksheet is present
            const sheetNames = workbook.worksheets.reduce(function (accu, curr) {
                accu.push(curr.name)
                return accu
            }, [])
            // use fuzzy search because of inconsistency in sheet naming
            const fuse = new Fuse(sheetNames, {
                includeScore: true,
                location: 0,
                threshold: 0.3,
                distance: config.worksheet.length,
            })
            const sheets = fuse.search(config.worksheet)
            if (!sheets.length) {
                errors.push({
                    msg: `invalid file: ${config.worksheet} is not present.`,
                    type: 'noSheet'
                })
                break
            }
            const { item: sheetName, score } = sheets[0]
            if (score >= 0.001) errors.push({
                msg: `invalid file: ${config.worksheet} is present but named inconsistent.`,
                type: 'inconsistentNaming',
                worksheet: config.worksheet,
                name: sheetName,
            })
            // 3. check if fields or columns are present by testing their values
            const sheet = workbook.getWorksheet(sheetName)
            const { columns, fields } = config
            if (columns) {
                const { rowOffset } = config || 0
                const headers = config.columns.reduce(function (prev, curr) {
                    if (curr.header) prev.push(curr.header)
                    return prev
                }, [])
                if (headers.length) {
                    const cells = sheet.getRows(1, 1 + sheet.lastRow.number).reduce(function (prev, curr) {
                        prev.push(curr.values)
                        return prev
                    }, [])
                    const offset = cells.findIndex(function (row) {
                        for (let hCnt = 0; hCnt < headers.length; hCnt++) {
                            const head = headers[hCnt]
                            return row.some(v => v === head)
                        }
                    })
                    if (offset + 1 !== rowOffset) {
                        errors.push({
                            msg: `invalid file: rowOffset seems to be: ${offset + 1} not ${rowOffset}.`,
                            rowOffset,
                            row: offset + 1,
                            type: 'wrongOffset',
                            worksheet: sheetName
                        })
                    }
                }
                for (let cCnt = 0; cCnt < columns.length; cCnt++) {
                    const column = columns[cCnt]
                    const cell = sheet.getCell(rowOffset, column.index)
                    if (!cell.value) errors.push({
                        msg: `invalid file: ${sheetName}.${column.key} is present but empty`,
                        type: 'emptyValue',
                        worksheet: sheetName,
                        key: column.key
                    })
                }
            }
            if (fields) {
                for (let fCnt = 0; fCnt < fields.length; fCnt++) {
                    const field = fields[fCnt]
                    const cell = sheet.getCell(field.row, field.col)
                    if (!cell.value) errors.push({
                        msg: `invalid file: ${sheetName}.${field.key} is present but empty`,
                        type: 'emptyValue',
                        worksheet: sheetName,
                        key: field.key
                    })
                }
            }
            break

    }

    return errors

}

module.exports = {
    validate,
    validateColumns,
    validateFields,
    validateConfig,
    validateMultiConfig,
    matchers
}