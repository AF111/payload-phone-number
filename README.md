# Payload Phone Number

A phone-number field for **Payload CMS v4**, powered by Google's libphonenumber metadata through [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js).

It uses Payload's own admin UI components for the label, description, and text input, with a responsive country selector and formatted previews that adapt to Payload's theme variables.

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

The field is a Payload group. It stores two normalized strings:

```json
{
  "phoneNumber": {
    "e164": "+46701234567",
    "national": "0701234567"
  }
}
```

- `e164`: canonical international number, including the leading `+`, with no spaces or punctuation.
- `national`: national number with the national trunk prefix where applicable, digits only, with no spaces or punctuation.

The admin UI displays libphonenumber's human-readable formats, for example:

- International: `+46 70 123 45 67`
- National: `070-123 45 67`

Formatting is for display only; it is not written to either stored value.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `defaultCountry` | `'US'` | ISO 3166-1 alpha-2 country used to interpret national input |
| `showFormattedPreviews` | `true` | Show international and national display formats |
| `required` | `false` | Require a valid phone number |
| `label` | `'Phone number'` | Admin field label |
| `description` | — | Help text below the input |

## Behavior and validation

- Numbers beginning with `+` are parsed as international numbers, regardless of the selected country.
- National-format input is interpreted using the selected country.
- Invalid or incomplete input is not stored as a normalized number.
- Server-side field validation checks that the E.164 and national values are valid and consistent.
- Extensions are currently not supported; enter the main phone number without an extension.

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
```

## License

MIT
