'use client'

import React, { useMemo, useState } from 'react'
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js'
import { FieldDescription, FieldLabel, TextInput, useField } from '@payloadcms/ui'
import type { GroupFieldClientComponent, GroupFieldClientProps } from 'payload'
import './phone-number-field.css'

export type PhoneNumberFieldProps = {
  path: string
  defaultCountry?: string
  showFormattedPreviews?: boolean
  required?: boolean
  label?: string
  description?: string
}

type PhoneNumberValue = { e164?: string; national?: string } | null

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countries = getCountries()
  .map((code) => ({ code, name: countryNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name))

function digits(value: string): string {
  return value.replace(/\D/g, '')
}

export const PhoneNumberField: GroupFieldClientComponent = (rawProps) => {
  const {
    path,
    defaultCountry = 'US',
    showFormattedPreviews = true,
    required = false,
    label,
    description,
    field,
  } = rawProps as GroupFieldClientProps & PhoneNumberFieldProps

  const { value: storedValue, setValue } = useField<PhoneNumberValue>({ path })
  const e164Value = storedValue?.e164
  const initialCountry = (
    countries.some(({ code }) => code === defaultCountry.toUpperCase())
      ? defaultCountry.toUpperCase()
      : 'US'
  ) as CountryCode
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [input, setInput] = useState<string>(() => {
    if (!e164Value) return ''
    const parsed = parsePhoneNumberFromString(e164Value)
    return parsed?.formatInternational() ?? e164Value
  })
  const [touched, setTouched] = useState(false)

  const parsed = useMemo(() => {
    if (!input.trim()) return undefined
    return input.trim().startsWith('+')
      ? parsePhoneNumberFromString(input)
      : parsePhoneNumberFromString(input, country)
  }, [input, country])

  const isValid = Boolean(parsed?.isValid())
  const hasInput = input.trim().length > 0
  const error = hasInput && touched && !isValid
    ? 'Enter a valid phone number for the selected country.'
    : undefined

  const onInputChange = (nextValue: string) => {
    setInput(nextValue)
    const phone = nextValue.trim().startsWith('+')
      ? parsePhoneNumberFromString(nextValue)
      : parsePhoneNumberFromString(nextValue, country)

    if (phone?.isValid() && !phone.ext) {
      setValue({ e164: phone.number, national: digits(phone.formatNational()) })
    } else {
      setValue(null)
    }
  }

  const onCountryChange = (nextCountry: string) => {
    const next = nextCountry as CountryCode
    setCountry(next)
    if (input && !input.trim().startsWith('+')) {
      const phone = parsePhoneNumberFromString(input, next)
      if (phone?.isValid() && !phone.ext) {
        setValue({ e164: phone.number, national: digits(phone.formatNational()) })
      } else {
        setValue(null)
      }
    }
  }

  const fieldLabel = label ?? field?.label ?? 'Phone number'
  const fieldDescription = description ?? field?.admin?.description

  return (
    <div className="payload-phone-number">
      <FieldLabel path={path} label={fieldLabel} required={required || field?.required} />
      <div className="payload-phone-number__controls">
        <label className="payload-phone-number__country">
          <span className="payload-phone-number__sr-only">Country</span>
          <select
            aria-label="Country"
            value={country}
            onChange={(event) => onCountryChange(event.target.value)}
          >
            {countries.map(({ code, name }) => (
              <option key={code} value={code}>
                {name} (+{getCountryCallingCode(code)})
              </option>
            ))}
          </select>
        </label>
        <div className="payload-phone-number__input">
          <TextInput
            path={path}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Enter phone number"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(error)}
          />
        </div>
      </div>
      {fieldDescription ? <FieldDescription description={fieldDescription} /> : null}
      {error ? <div className="payload-phone-number__error" role="alert">{error}</div> : null}
      {showFormattedPreviews && isValid && parsed ? (
        <div className="payload-phone-number__previews" aria-live="polite">
          <div>
            <span>International</span>
            <strong>{parsed.formatInternational()}</strong>
          </div>
          <div>
            <span>National</span>
            <strong>{parsed.formatNational()}</strong>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PhoneNumberField
