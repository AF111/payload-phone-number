# Payload Phone Number

A phone-number field for **Payload CMS v4**, powered by Google's full phone-number metadata through [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js).

It uses Payload's own admin UI components for the label, description, and text input, with a searchable country selector, country flags from [FlagCDN](https://flagcdn.com/), and formatted previews that adapt to Payload's theme variables.

## Install from GitHub

The package is currently installed directly from this public repository:

```bash
pnpm add github:AF111/payload-phone-number
```

Or with npm:

```bash
npm install github:AF111/payload-phone-number
```

The GitHub installation runs the package's `prepare` script to build the TypeScript files and copy its stylesheet. Install the Payload v4 peer dependencies in your project if they are not already present:

```bash
pnpm add payload@^4 @payloadcms/ui@^4 react@^19 react-dom@^19
```

## Configure

Register the field in a collection:

```ts
import type { CollectionConfig } from 'payload'
import { phoneNumberField } from 'payload-phone-number'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  fields: [
    phoneNumberField('phoneNumber', {
      label: 'Phone number',
      defaultCountry: 'SE',
      required: true,
      showFormattedPreviews: true,
    }),
  ],
}
```

## Stored data

The field is a Payload group. It stores the canonical number and useful country/number metadata together:

```json
{
  "phoneNumber": {
    "intlFormat": "+46701234567",
    "nationalFormat": "0701234567",
    "dialingCode": "+46",
    "country": "SE",
    "countryName": "Sweden",
    "numberType": "MOBILE"
  }
}
```

| Property | Description |
| --- | --- |
| `intlFormat` | Canonical E.164 number, including the leading `+`, with no spaces or punctuation. |
| `nationalFormat` | National number with the trunk prefix where applicable, digits only. |
| `dialingCode` | International calling code, including the leading `+`. |
| `country` | ISO 3166-1 alpha-2 country/region code, e.g. `SE`. Null for non-geographic numbers. |
| `countryName` | English country/region name, e.g. `Sweden`. Null for non-geographic numbers. |
| `numberType` | libphonenumber classification such as `MOBILE`, `FIXED_LINE`, or `VOIP`; null when unavailable. |

The admin UI displays libphonenumber's human-readable formats, for example:

- International: `+46 70 123 45 67`
- National: `070-123 45 67`

Display formatting is separate from the normalized stored values. `intlFormat` remains E.164, while `nationalFormat` is digits only.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `defaultCountry` | `'US'` | ISO 3166-1 alpha-2 country used to interpret national input |
| `showFormattedPreviews` | `true` | Show international and national display formats |
| `required` | `false` | Require a valid phone number |
| `label` | `'Phone number'` | Admin field label |
| `description` | — | Help text below the field |

## Behavior and validation

- Numbers beginning with `+` or the international access prefix `00` are detected as international numbers, regardless of the currently selected country.
- When the input loses focus, an international number that identifies a country updates the country selector and replaces the dialing-code-prefixed input with its national format.
- Parsing and validation are deferred until the input loses focus, rather than running on every keystroke.
- National-format input is interpreted using the selected country.
- Invalid or incomplete input is not stored as a normalized number. Empty optional groups are accepted; partially populated groups are rejected.
- Server-side validation checks that the stored number, calling code, country, country name, and number type are consistent.
- Country flags are loaded from FlagCDN.
- Extensions are currently not supported; enter the main phone number without an extension.

## Migration note

Version 0.2.0 changes the stored property names from `e164` and `national` to `intlFormat` and `nationalFormat`, and adds metadata fields. Existing documents are not automatically migrated. Update existing stored group values before relying on the new server-side validation.

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
```

## License

MIT
