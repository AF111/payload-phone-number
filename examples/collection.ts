import type { CollectionConfig } from 'payload'
import { phoneNumberField } from 'payload-phone-number'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    phoneNumberField('phoneNumber', {
      label: 'Phone number',
      defaultCountry: 'SE',
      required: true,
      description: 'Choose a country and enter the phone number.',
      showFormattedPreviews: true,
    }),
  ],
}
