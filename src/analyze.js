const Ajv = require("ajv")
const ExcelJS = require('exceljs')
const Fuse = require('fuse.js')

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
            await workbook.xlsx.readFile(filename)
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
                worksheet: sheetName
            })
            // 3. check if fields or columns are present by testing their values
            // TODO : validate rowOffset by searching for headers if given
            const sheet = workbook.getWorksheet(sheetName)
            const { columns, fields } = config
            if (columns) {
                const { rowOffset } = config || 0
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
    validateMultiConfig
}