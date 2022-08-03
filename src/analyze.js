const fs = require('fs')
const path = require('path')
const Ajv = require("ajv")
const ExcelJS = require('exceljs')
const Fuse = require('fuse.js')

const sysSepMatcher = new RegExp(`\\${path.sep}`, 'i')
const pdfMatcher = /\.pdf$/i
const xlsxMatcher = /\.xlsx$|\.xlsm$/i

// TODO : move es32 specific's to own module
const yearFolderMatcher = new RegExp(`${sysSepMatcher.source}\\d{4}$`, 'i')
const eventFolderMatcher = new RegExp(
    `${sysSepMatcher.source}(eigenveranstaltung|ge2 kongresse|ge3 gast|interne vas|filmdreharbeiten|palais)${sysSepMatcher.source}`,
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

// .xlsx configuration schemas
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

// TODO : file not exists error
// validation errors
class ValidationError extends Error {
    constructor(filename, worksheet, message) {
        super(message)
        this.name = 'ValidationError'
        this.filename = filename
        this.worksheet = worksheet
    }
}

class ConfigInvalid extends ValidationError {
    constructor(errors, { worksheet = '', filename = '' } = {}) {
        super(filename, worksheet, 'Config is invalid.')
        this.name = 'ConfigInvalid'
        this.errors = errors
    }
}

class SheetMissing extends ValidationError {
    constructor(filename, worksheet) {
        super(filename, worksheet, `Worksheet: ${worksheet} is missing.`)
        this.name = 'SheetMissing'
    }
}

class InconsistentSheetName extends ValidationError {
    constructor(filename, worksheet, config) {
        super(filename, worksheet, `Worksheet: ${config.worksheet} is present but named inconsistent.`)
        this.name = 'InconsistentSheetName'
        this.valid = config.worksheet
    }
}

class IncorrectRowOffset extends ValidationError {
    constructor(filename, worksheet, key, valid) {
        super(filename, worksheet, `Worksheet: ${worksheet} rowOffset seems to be: ${valid}.`)
        this.name = 'IncorrectRowOffset'
        this.key = key
        this.valid = valid
    }
}

class IncorrectColumnIndex extends ValidationError {
    constructor(filename, worksheet, key, valid) {
        super(filename, worksheet, `Worksheet: ${worksheet} column index: ${key} seems to be: ${valid}.`)
        this.name = 'IncorrectColumnIndex'
        this.key = key
        this.valid = valid
    }
}

class MissingDataHeader extends ValidationError {
    constructor(filename, worksheet, key, header) {
        super(filename, worksheet, `Worksheet: ${worksheet} data header for: ${key} is missing.`)
        this.name = 'MissingDataHeader'
        this.key = key
        this.header = header
    }
}

class DataHeaderNotInConfig extends ValidationError {
    constructor(filename, worksheet, header, index) {
        super(filename, worksheet, `Worksheet: ${worksheet} data header: ${header} not in config.`)
        this.name = 'DataHeaderNotInConfig'
        this.header = header
        this.index = index
    }
}

class InvalidData extends ValidationError {
    constructor(filename, worksheet, key) {
        super(filename, worksheet, `Worksheet: ${worksheet} key: ${key} contains invalid data.`)
        this.name = 'InvalidData'
        this.key = key
    }
}

class Errors {
    static ValidationError = ValidationError
    static ConfigInvalid = ConfigInvalid
    static SheetMissing = SheetMissing
    static InconsistentSheetName = InconsistentSheetName
    static IncorrectRowOffset = IncorrectRowOffset
    static IncorrectColumnIndex = IncorrectColumnIndex
    static MissingDataHeader = MissingDataHeader
    static DataHeaderNotInConfig = DataHeaderNotInConfig
    static InvalidData = InvalidData
}

/**
 * Adapt a configuration to an invalid configured file
 * @param {Object} config to adapt to the file
 * @param {Array} errors to change the configuration
 * @returns {Object} a new object with the changed parameters
 */
function adapt(config, errors) {
    const adaption = Object.assign({}, config)
    // validate config and use the results as flags
    const isColumns = validateColumns(config)
    const isFields = validateFields(config)
    const isConfig = validateConfig(config)
    const isMultiConfig = validateMultiConfig(config)
    switch (true) {
        case !isColumns && !isFields && !isConfig && !isMultiConfig:
            // configuration error
            throw new ConfigInvalid([
                ...validateColumns.errors,
                ...validateFields.errors,
                ...validateConfig.errors,
                ...validateMultiConfig.errors
            ])

        case !isColumns && !isFields && !isConfig:
            // adapt a multi config
            for (const key in adaption) {
                const subConfig = adaption[key]
                const noSheet = errors.find(function (error) {
                    return error.name === 'SheetMissing' && error.worksheet === subConfig.worksheet
                })
                if (noSheet) {
                    delete adaption[key]
                } else {
                    adaption[key] = adapt(subConfig, errors)
                }
            }
            break

        case !isColumns && !isFields:
            // adapt a single config
            const invalidName = errors.find(function (error) {
                return error.name === 'InconsistentSheetName' && error.valid === config.worksheet
            })
            if (invalidName) {
                adaption.worksheet = invalidName.worksheet
            }
            const offset = errors.find(function (error) {
                return error.name === 'IncorrectRowOffset' && error.worksheet === adaption.worksheet
            })
            if (offset) {
                adaption.rowOffset = offset.valid
            }
            // TODO : strategy for adapting empty values? set to zero or null string
            break
    }

    return adaption

}

/**
 * Validate a *.xlsx file with a configuration. Returning the differences.
 * @param {String} filename 
 * @param {Object} config
 * @returns {[ValidationError]} errors
 */
async function validate(filename, config) {
    // validate config and use the results as flags
    const isColumns = validateColumns(config)
    const isFields = validateFields(config)
    const isConfig = validateConfig(config)
    const isMultiConfig = validateMultiConfig(config)
    // test the file based on the config by trying to access the data
    const errors = []
    switch (true) {
        case !isColumns && !isFields && !isConfig && !isMultiConfig:
            throw new ConfigInvalid([
                ...validateColumns.errors,
                ...validateFields.errors,
                ...validateConfig.errors,
                ...validateMultiConfig.errors
            ])

        case !isColumns && !isFields && !isConfig:
            // validate a multi config
            for (const key in config) {
                const subConfig = config[key]
                errors.push(...(await validate(filename, subConfig)))
            }
            break

        case !isColumns && !isFields:
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
                errors.push(new SheetMissing(filename, config.worksheet))
                break
            }
            const { item: sheetName, score } = sheets[0]
            if (score >= 0.001) {
                errors.push(new InconsistentSheetName(filename, sheetName, config))
            }
            // 3. check if fields or columns are present
            const sheet = workbook.getWorksheet(sheetName)
            const cells = sheet.getRows(1, 1 + sheet.lastRow.number).reduce(function (prev, curr) {
                prev.push(curr.values)
                return prev
            }, []).map(function (row) {
                // remove undefined from first position
                if (row[0] === undefined) row.shift()
                // trim off whitespace
                return row.map(cell => {
                    if (cell && cell.trim) {
                        return cell.trim()
                    } else {
                        return cell
                    }
                })
            })
            const { columns, fields } = config
            if (columns) {
                // testing columns
                const { rowOffset } = config || 0
                // get data headers if present
                const headers = columns.reduce(function (prev, curr) {
                    if (curr.header) prev.push({
                        key: curr.key,
                        index: curr.index,
                        header: curr.header
                    })
                    return prev
                }, [])
                if (headers.length) {
                    // compare headers with columns
                    for (let hCnt = 0; hCnt < headers.length; hCnt++) {
                        const header = headers[hCnt]
                        const compare = { index: header.index, rowOffset: rowOffset }
                        let found = false
                        for (let cCnt = 0; cCnt < cells.length; cCnt++) {
                            const row = cells[cCnt]
                            const index = row.indexOf(header.header)
                            if (index > -1) {
                                compare.index = index + 1
                                compare.rowOffset = cCnt + 1
                                found = true
                                break
                            }
                        }
                        if (!found) {
                            errors.push(new MissingDataHeader(filename, sheetName, header.key, header.header))
                            // move on to the next header 
                            continue
                        }
                        if (compare.rowOffset !== rowOffset) {
                            errors.push(new IncorrectRowOffset(filename, sheetName, header.key, compare.rowOffset))
                        }
                        if (compare.index !== header.index) {
                            errors.push(new IncorrectColumnIndex(filename, sheetName, header.key, compare.index))
                        }
                    }
                    // search for additional data headers not present in the config
                    const incorrectRowOffset = errors.find(function (error) {
                        return error.name === 'IncorrectRowOffset'
                    })
                    const headerRowIndex = incorrectRowOffset ? incorrectRowOffset.valid : rowOffset
                    const headerRow = cells[headerRowIndex - 1]
                    for (let hCnt = 0; hCnt < headerRow.length; hCnt++) {
                        const dataHeader = headerRow[hCnt]
                        if (dataHeader) {
                            const confHeader = headers.find(function (header) {
                                return header.header === dataHeader
                            })
                            if (!confHeader) {
                                errors.push(new DataHeaderNotInConfig(filename, sheetName, dataHeader, hCnt))
                            }
                        }
                    }
                }
            }
            if (fields) {
                // testing fields
                for (let fCnt = 0; fCnt < fields.length; fCnt++) {
                    const field = fields[fCnt]
                    const cell = cells[field.row - 1][field.col - 1]
                    if (!cell) {
                        errors.push(new InvalidData(filename, sheetName, field.key))
                    }
                }
            }
            break

    }

    return errors

}

module.exports = {
    adapt,
    validate,
    Errors,
    validateColumns,
    validateFields,
    validateConfig,
    validateMultiConfig,
    matchers
}