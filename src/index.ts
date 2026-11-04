import { parsePhoneNumberFromString } from 'libphonenumber-js'
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
  e164: string
  national: string
}

/**
 * Creates a Payload v4 group field that stores normalized phone number values:
 * { e164: '+46701234567', national: '0701234567' }.
 *
 * The national value contains digits only and retains the national trunk prefix.
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
          clientProps: { defaultCountry, showFormattedPreviews, required, label, description },
        },
      },
    },
    fields: [
      { name: 'e164', type: 'text', admin: { hidden: true } },
      { name: 'national', type: 'text', admin: { hidden: true } },
    ],
    validate: (value) => {
      const phoneValue = value as Partial<PhoneNumberValue> | null | undefined
      if (!phoneValue?.e164 || !phoneValue?.national) {
        return required ? 'A valid phone number is required.' : true
      }

      const parsed = parsePhoneNumberFromString(phoneValue.e164)
      if (
        !parsed?.isValid() ||
        parsed.number !== phoneValue.e164 ||
        !/^\d+$/.test(phoneValue.national) ||
        phoneValue.national !== parsed.formatNational().replace(/\D/g, '')
      ) {
        return 'Enter a valid phone number. The stored values must be normalized.'
      }

      return true
    },
  }
}
