'use client'

import React, { useState } from 'react'
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
  type PhoneNumber,
} from 'libphonenumber-js/max'
import { FieldError, FieldLabel, ReactSelect, TextInput, useField } from '@payloadcms/ui'
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

  // Accept the common international access prefix as well as an explicit plus.
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

export const PhoneNumberField: React.FC<GroupFieldClientProps & PhoneNumberFieldProps> = (rawProps) => {
  const {
    path,
    defaultCountry = 'US',
    showFormattedPreviews = true,
    required = false,
    label,
    description,
    field,
  } = rawProps as GroupFieldClientProps & PhoneNumberFieldProps

  // A Payload group is made up of child field paths. Update each nested path
  // so Payload serializes the group with its complete normalized value.
  const { value: intlFormatValue, setValue: setIntlFormatValue, showError } = useField<string | null>({
    path: \`\${path}.intlFormat\`,
  })
  const { value: nationalFormatValue, setValue: setNationalFormatValue } = useField<string | null>({
    path: \`\${path}.nationalFormat\`,
  })
  const { setValue: setDialingCode } = useField<string | null>({ path: \`\${path}.dialingCode\` })
  const { setValue: setCountryValue } = useField<string | null>({ path: \`\${path}.country\` })
  const { setValue: setCountryName } = useField<string | null>({ path: \`\${path}.countryName\` })
  const { setValue: setNumberType } = useField<string | null>({ path: \`\${path}.numberType\` })

  const initialCountry = getCountry(intlFormatValue ?? undefined, defaultCountry)
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [input, setInput] = useState<string>(() => {
    if (nationalFormatValue) return nationalFormatValue
    if (!intlFormatValue) return ''
    return parsePhoneNumberFromString(intlFormatValue)?.formatNational() ?? intlFormatValue
  })
  const [validationError, setValidationError] = useState<string | undefined>()
  const [validatedPhone, setValidatedPhone] = useState<PhoneNumber | undefined>()

  const validateAndStore = (rawInput: string, selectedCountry: CountryCode) => {
    const trimmed = rawInput.trim()

    if (!trimmed) {
      setIntlFormatValue(null)
      setNationalFormatValue(null)
      setDialingCode(null)
      setCountryValue(null)
      setCountryName(null)
      setNumberType(null)
      setValidatedPhone(undefined)
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
      // Country detection and dial-code removal happen only after blur.
      setCountry(detectedCountry as CountryCode)
      setInput(phone.formatNational())
    }

    if (phone?.isValid() && !phone.ext) {
      const national = digits(phone.formatNational())
      const phoneCountry = phone.country ?? null
      setIntlFormatValue(phone.number)
      setNationalFormatValue(national)
      setDialingCode(\`+\${phone.countryCallingCode}\`)
      setCountryValue(phoneCountry)
      setCountryName(phoneCountry ? countryNames.of(phoneCountry) ?? null : null)
      setNumberType(phone.getType() ?? null)
      setValidatedPhone(phone)
      setValidationError(undefined)
      return
    }

    // Keep invalid input visible and let server validation reject partial data.
    setIntlFormatValue(trimmed)
    setNationalFormatValue('')
    setDialingCode('')
    setCountryValue(null)
    setCountryName(null)
    setNumberType(null)
    setValidatedPhone(undefined)
    setValidationError('Enter a valid phone number for the selected country.')
  }

  const onInputBlur = () => {
    validateAndStore(input, country)
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
            options={countryOptions}
            value={countryOptions.find((option) => option.value === country)}
            onChange={(option) => {
              if (option && !Array.isArray(option)) onCountryChange(String(option.value))
            }}
            formatOptionLabel={(option) => (
              <span className="payload-phone-number__country-option">
                <img
                  src={\`https://flagcdn.com/w20/\${String(option.value).toLowerCase()}.png\`}
                  srcSet={\`https://flagcdn.com/w40/\${String(option.value).toLowerCase()}.png 2x\`}
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
          <TextInput
            Label={<></>}
            Error={
              <FieldError
                path={path}
                message={validationError}
                showError={Boolean(validationError) || showError}
              />
            }
            showError={Boolean(validationError) || showError}
            path={path}
            value={input}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setInput(event.target.value)
              // Don't parse or validate while the user is actively typing.
              setValidationError(undefined)
              setValidatedPhone(undefined)
            }}
            placeholder="Enter phone number"
            description={fieldDescription}
            htmlAttributes={{
              autoComplete: 'tel',
              onBlur: onInputBlur,
            }}
          />
        </div>
      </div>
      {showFormattedPreviews && validatedPhone ? (
        <div className="payload-phone-number__previews" aria-live="polite">
          <div>
            <span>International</span>
            <strong>{validatedPhone.formatInternational()}</strong>
          </div>
          <div>
            <span>National</span>
            <strong>{validatedPhone.formatNational()}</strong>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PhoneNumberField
