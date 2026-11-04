'use client'

import React, { useMemo, useState } from 'react'
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js/max'
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

type PhoneNumberValue = { e164?: string; national?: string } | null

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

  const { value: storedValue, setValue, showError } = useField<PhoneNumberValue>({ path })
  const e164Value = storedValue?.e164
  const storedCountry = e164Value ? parsePhoneNumberFromString(e164Value)?.country : undefined
  const preferredCountry = storedCountry ?? defaultCountry.toUpperCase()
  const initialCountry = (
    countries.some(({ code }) => code === preferredCountry)
      ? preferredCountry
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

  const isValid = Boolean(parsed?.isValid() && !parsed.ext)
  const hasInput = input.trim().length > 0
  const error = hasInput && touched && !isValid
    ? 'Enter a valid phone number for the selected country.'
    : undefined

  const onInputChange = (nextValue: string) => {
    setTouched(true)
    setInput(nextValue)
    if (!nextValue.trim()) {
      setValue(null)
      return
    }

    const phone = nextValue.trim().startsWith('+')
      ? parsePhoneNumberFromString(nextValue)
      : parsePhoneNumberFromString(nextValue, country)

    if (phone?.isValid() && !phone.ext) {
      setValue({ e164: phone.number, national: digits(phone.formatNational()) })
    } else {
      setValue({ e164: nextValue.trim(), national: '' })
    }
  }

  const onCountryChange = (nextCountry: string) => {
    const next = nextCountry as CountryCode
    setCountry(next)
    if (input.trim()) setTouched(true)
    if (input && !input.trim().startsWith('+')) {
      const phone = parsePhoneNumberFromString(input, next)
      if (phone?.isValid() && !phone.ext) {
        setValue({ e164: phone.number, national: digits(phone.formatNational()) })
      } else {
        setValue({ e164: input.trim(), national: '' })
      }
    }
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
            isClearable={false}
            placeholder="Country"
          />
        </div>
        <div className="payload-phone-number__input">
          <TextInput
            Label={<></>}
            Error={<FieldError path={path} message={error} showError={Boolean(error) || showError} />}
            showError={Boolean(error) || showError}
            path={path}
            value={input}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onInputChange(event.target.value)}
            placeholder="Enter phone number"
            description={fieldDescription}
            htmlAttributes={{ autoComplete: 'tel' }}
          />
        </div>
      </div>
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
