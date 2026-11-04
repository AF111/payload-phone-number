# Changelog

## 0.2.1

- Remove the formatted preview panels; display the validated national format directly in the input.
- Format existing valid numbers on initial load and after blur.
- Avoid marking Payload data as edited when an untouched input is focused and blurred.
- Center the selected country flag and label in the country selector.


## 0.2.0

- Fix TypeScript narrowing in server-side normalized value validation.
- Handle input blur on the containing field wrapper instead of passing an unsupported HTML attribute.

- Rename stored `e164` and `national` properties to `intlFormat` and `nationalFormat`.
- Store the international dialing code, ISO country code, English country name, and detected number type.
- Validate that all stored metadata matches the normalized phone number.
- This is a breaking stored-data schema change; existing documents require migration.

## 0.1.1

- Update nested Payload group fields directly to prevent empty group submissions.
- Defer number parsing, country detection, and validation until the input loses focus.
- Allow empty optional phone number groups and retain validation for partially populated values.
- Size the country selector to the selected country label, with truncation for long names.

## 0.1.0

- Initial Payload CMS v4 phone number field.
- Country selection and libphonenumber-js validation.
- Normalized E.164 and national values with formatted previews.
