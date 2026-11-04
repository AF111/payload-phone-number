'use client'

import React, { useRef, useState } from 'react'
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js/max'
import { FieldError, FieldLabel, ReactSelect, useField } from '@payloadcms/ui'
import type { GroupFieldClientProps } from 'payload'
import './phone-number-field.css'

export type PhoneNumberFieldProps = {
  path: string
  defaultCountry?: string
  showFormattedPreviews?: boolean
  required?: boolean
  label?: string
  description?: string
}

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countries = getCountries()
  .map((code) => ({ code, name: countryNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name))

const countryOptions = countries.map(({ code, name }) => ({
  label: name + ' (+' + getCountryCallingCode(code) + ')',
  value: code,
}))

function digits(value: string): string {
  return value.replace(/\D/g, '')
}

function parseInput(value: string, country: CountryCode) {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const international = trimmed.startsWith('+') || trimmed.startsWith('00')
  const normalized = trimmed.startsWith('00') ? '+' + trimmed.slice(2) : trimmed

  return international
    ? parsePhoneNumberFromString(normalized)
    : parsePhoneNumberFromString(normalized, country)
}

function getCountry(value: string | undefined, fallback: string): CountryCode {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined
  const preferred = parsed?.country ?? fallback.toUpperCase()
  return (countries.some(({ code }) => code === preferred) ? preferred : 'US') as CountryCode
}

function getInitialDisplayValue(
  intlFormat: string | null | undefined,
  nationalFormat: string | null | undefined,
  country: CountryCode,
): string {
  if (intlFormat) {
    const parsed = parsePhoneNumberFromString(intlFormat)
    if (parsed?.isValid()) return parsed.formatNational()
  }

  if (nationalFormat) {
    const parsed = parseInput(nationalFormat, country)
    if (parsed?.isValid()) return parsed.formatNational()
    return nationalFormat
  }

  return intlFormat ?? ''
}

export const PhoneNumberField: React.FC<GroupFieldClientProps & PhoneNumberFieldProps> = (rawProps) => {
  const {
    path,
    defaultCountry = 'US',
    required = false,
    label,
    description,
    field,
  } = rawProps as GroupFieldClientProps & PhoneNumberFieldProps

  const { value: intlFormatValue, setValue: setIntlFormatValue, showError } = useField<string | null>({
    path: `${path}.intlFormat`,
  })
  const { value: nationalFormatValue, setValue: setNationalFormatValue } = useField<string | null>({
    path: `${path}.nationalFormat`,
  })
  const { setValue: setDialingCode } = useField<string | null>({ path: `${path}.dialingCode` })
  const { setValue: setCountryValue } = useField<string | null>({ path: `${path}.country` })
  const { setValue: setCountryName } = useField<string | null>({ path: `${path}.countryName` })
  const { setValue: setNumberType } = useField<string | null>({ path: `${path}.numberType` })

  const initialCountry = getCountry(intlFormatValue ?? undefined, defaultCountry)
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [input, setInput] = useState<string>(() =>
    getInitialDisplayValue(intlFormatValue, nationalFormatValue, initialCountry),
  )
  const [validationError, setValidationError] = useState<string | undefined>()
  const editedSinceFocus = useRef(false)

  const validateAndStore = (rawInput: string, selectedCountry: CountryCode) => {
    const trimmed = rawInput.trim()

    if (!trimmed) {
      setIntlFormatValue(null)
      setNationalFormatValue(null)
      setDialingCode(null)
      setCountryValue(null)
      setCountryName(null)
      setNumberType(null)
      setValidationError(required ? 'A valid phone number is required.' : undefined)
      return
    }

    const phone = parseInput(trimmed, selectedCountry)
    const detectedCountry = phone?.country
    const canSelectDetectedCountry = Boolean(
      detectedCountry && countries.some(({ code }) => code === detectedCountry),
    )

    if (
      /^\s*(?:\+|00)/.test(trimmed) &&
      phone &&
      canSelectDetectedCountry &&
      !phone.ext
    ) {
      setCountry(detectedCountry as CountryCode)
    }

    if (phone?.isValid() && !phone.ext) {
      const national = digits(phone.formatNational())
      const phoneCountry = phone.country ?? null
      setIntlFormatValue(phone.number)
      setNationalFormatValue(national)
      setDialingCode(`+${phone.countryCallingCode}`)
      setCountryValue(phoneCountry)
      setCountryName(phoneCountry ? countryNames.of(phoneCountry) ?? null : null)
      setNumberType(phone.getType() ?? null)
      setInput(phone.formatNational())
      setValidationError(undefined)
      return
    }

    setIntlFormatValue(trimmed)
    setNationalFormatValue('')
    setDialingCode('')
    setCountryValue(null)
    setCountryName(null)
    setNumberType(null)
    setValidationError('Enter a valid phone number for the selected country.')
  }

  const onCountryChange = (nextCountry: string) => {
    const next = nextCountry as CountryCode
    setCountry(next)
    if (input.trim()) validateAndStore(input, next)
  }

  const fieldLabel = label ?? field?.label ?? 'Phone number'
  const fieldDescription = description ?? field?.admin?.description

  return (
    <div className="payload-phone-number">
      <FieldLabel path={path} label={fieldLabel} required={required} />
      <div className="payload-phone-number__controls">
        <div className="payload-phone-number__country">
          <ReactSelect
            aria-label="Country"
            classNamePrefix="rs"
            options={countryOptions}
            value={countryOptions.find((option) => option.value === country)}
            onChange={(option) => {
              if (option && !Array.isArray(option)) onCountryChange(String(option.value))
            }}
            formatOptionLabel={(option) => (
              <span className="payload-phone-number__country-option">
                <img
                  src={`https://flagcdn.com/w20/${String(option.value).toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/w40/${String(option.value).toLowerCase()}.png 2x`}
                  width="20"
                  height="15"
                  loading="lazy"
                  alt=""
                />
                <span>{String(option.label)}</span>
              </span>
            )}
            isClearable={false}
            placeholder="Country"
          />
        </div>
        <div className="payload-phone-number__input">
          <input
            id={`${path}-input`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={input}
            placeholder="Enter phone number"
            aria-invalid={Boolean(validationError) || showError}
            onFocus={() => {
              editedSinceFocus.current = false
            }}
            onChange={(event) => {
              editedSinceFocus.current = true
              setInput(event.target.value)
              setValidationError(undefined)
            }}
            onBlur={() => {
              if (editedSinceFocus.current) validateAndStore(input, country)
              editedSinceFocus.current = false
            }}
          />
        </div>
      </div>
      {fieldDescription ? <div className="payload-phone-number__description">{fieldDescription}</div> : null}
      <FieldError
        path={path}
        message={validationError}
        showError={Boolean(validationError) || showError}
      />
    </div>
  )
}

export default PhoneNumberField
