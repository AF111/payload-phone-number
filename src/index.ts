import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import type { Field } from 'payload'

export type PhoneNumberFieldOptions = {
  /** ISO 3166-1 alpha-2 country code used when the user enters a national number. */
  defaultCountry?: string
  /** Show the formatted international and national previews below the input. */
  showFormattedPreviews?: boolean
  /** Mark the field as required. */
  required?: boolean
  /** Field label shown in the Payload admin panel. */
  label?: string
  /** Help text shown below the field. */
  description?: string
}

export type PhoneNumberValue = {
  /** Canonical E.164 number, including the leading +. */
  intlFormat: string
  /** National number containing digits only, retaining the trunk prefix where applicable. */
  nationalFormat: string
  /** International calling code, including the leading +. */
  dialingCode: string
  /** ISO 3166-1 alpha-2 region code, or null for non-geographic numbers. */
  country: string | null
  /** English country/region name, or null for non-geographic numbers. */
  countryName: string | null
  /** libphonenumber number type, e.g. MOBILE or FIXED_LINE; may be null if unknown. */
  numberType: string | null
}

/**
 * Creates a Payload group field that stores normalized phone number values:
 * {
 *   intlFormat: '+46701234567',
 *   nationalFormat: '0701234567',
 *   dialingCode: '+46',
 *   country: 'SE',
 *   countryName: 'Sweden',
 *   numberType: 'MOBILE'
 * }.
 */
export const phoneNumberField = (
  name: string,
  options: PhoneNumberFieldOptions = {},
): Field => {
  const {
    defaultCountry = 'US',
    showFormattedPreviews = true,
    required = false,
    label = 'Phone number',
    description,
  } = options

  const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

  return {
    name,
    type: 'group',
    label,
    required,
    admin: {
      description,
      components: {
        Field: {
          path: 'payload-phone-number/client#PhoneNumberField',
          clientProps: {
            defaultCountry,
            showFormattedPreviews,
            required,
            label,
            ...(description ? { description } : {}),
          },
        },
      },
    },
    fields: [
      { name: 'intlFormat', type: 'text', admin: { hidden: true } },
      { name: 'nationalFormat', type: 'text', admin: { hidden: true } },
      { name: 'dialingCode', type: 'text', admin: { hidden: true } },
      { name: 'country', type: 'text', admin: { hidden: true } },
      { name: 'countryName', type: 'text', admin: { hidden: true } },
      { name: 'numberType', type: 'text', admin: { hidden: true } },
    ],
    validate: (value) => {
      const phoneValue = value as Partial<PhoneNumberValue> | null | undefined
      const hasIntlFormat =
        typeof phoneValue?.intlFormat === 'string' && phoneValue.intlFormat.trim().length > 0
      const hasNationalFormat =
        typeof phoneValue?.nationalFormat === 'string' && phoneValue.nationalFormat.trim().length > 0

      // Payload can submit an untouched optional group as an empty object.
      if (!hasIntlFormat && !hasNationalFormat) {
        return required ? 'A valid phone number is required.' : true
      }
      if (
        !hasIntlFormat ||
        !hasNationalFormat ||
        typeof phoneValue?.intlFormat !== 'string' ||
        typeof phoneValue?.nationalFormat !== 'string' ||
        !phoneValue?.dialingCode ||
        phoneValue.country === undefined ||
        phoneValue.countryName === undefined ||
        phoneValue.numberType === undefined
      ) {
        return 'Enter a valid phone number. The stored values must be normalized.'
      }

      const intlFormat = phoneValue.intlFormat
      const nationalFormat = phoneValue.nationalFormat
      const parsed = parsePhoneNumberFromString(intlFormat)
      const expectedCountry = parsed?.country ?? null
      const expectedCountryName = expectedCountry ? countryNames.of(expectedCountry) ?? null : null
      const expectedNumberType = parsed?.getType() ?? null

      if (
        !parsed?.isValid() ||
        parsed.number !== intlFormat ||
        !/^\d+$/.test(nationalFormat) ||
        nationalFormat !== parsed.formatNational().replace(/\D/g, '') ||
        phoneValue.dialingCode !== `+${parsed.countryCallingCode}` ||
        phoneValue.country !== expectedCountry ||
        phoneValue.countryName !== expectedCountryName ||
        phoneValue.numberType !== expectedNumberType
      ) {
        return 'Enter a valid phone number. The stored values must be normalized.'
      }

      return true
    },
  }
}
