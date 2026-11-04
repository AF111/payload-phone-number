import assert from 'node:assert/strict'
import test from 'node:test'
import { phoneNumberField } from '../dist/index.js'

const optionalField = phoneNumberField('phone', { defaultCountry: 'SE' })
const requiredField = phoneNumberField('phone', { defaultCountry: 'SE', required: true })
const validSwedishNumber = {
  intlFormat: '+46701234567',
  nationalFormat: '0701234567',
  dialingCode: '+46',
  country: 'SE',
  countryName: 'Sweden',
  numberType: 'MOBILE',
}

const validate = (field, value) => field.validate(value)

test('accepts an empty optional phone group', async () => {
  assert.equal(await validate(optionalField, {}), true)
  assert.equal(await validate(optionalField, null), true)
})

test('requires a value when configured as required', async () => {
  assert.equal(await validate(requiredField, {}), 'A valid phone number is required.')
})

test('accepts a correctly normalized Swedish mobile number', async () => {
  assert.equal(await validate(optionalField, validSwedishNumber), true)
})

test('rejects an incorrect calling code', async () => {
  assert.match(
    await validate(optionalField, { ...validSwedishNumber, dialingCode: '+1' }),
    /stored values must be normalized/,
  )
})

test('rejects mismatched country metadata', async () => {
  assert.match(
    await validate(optionalField, { ...validSwedishNumber, country: 'NO' }),
    /stored values must be normalized/,
  )
})

test('rejects punctuation in the stored national format', async () => {
  assert.match(
    await validate(optionalField, { ...validSwedishNumber, nationalFormat: '070-123 45 67' }),
    /stored values must be normalized/,
  )
})

test('rejects incomplete groups', async () => {
  assert.match(
    await validate(optionalField, { intlFormat: '+46701234567' }),
    /stored values must be normalized/,
  )
})

test('rejects invalid E.164 values', async () => {
  assert.match(
    await validate(optionalField, { ...validSwedishNumber, intlFormat: '+46000000000' }),
    /stored values must be normalized/,
  )
})
