# Bases action cards

A custom Obsidian Bases view that mimics the built-in cards layout while letting you customize card click behavior.

## What it does

This plugin registers a Bases view named **Action Cards**.

It behaves like cards view, with these configurable options:

- **Image property**: controls the card cover (similar to built-in cards)
- **Link property**: when set and valid, clicking a card opens this link instead of the note
- **Card size**: adjusts the card width in the grid
- **Image fit**: switches between `Cover` and `Contain`
- **Image aspect ratio**: controls the height/shape of the image frame

The card only shows properties selected as visible in the Bases view configuration, matching the card visibility behavior more closely.

## Link property behavior

- If **Link property** is not set, null, or empty, clicking opens the note itself.
- If **Link property** contains a valid redirect target, clicking opens that target.
- If **Link property** contains an invalid value, clicking shows a meaningful error notice instead of opening an unrelated note.

## Supported link types for Link property

The view supports links commonly used in Obsidian properties:

- Internal links to notes/files (`[[Note]]`, `[[Folder/File.md]]`)
- Markdown links (`[label](target)`)
- Existing vault file paths
- Website URLs (`https://example.com`, `http://...`, `www...`)
- Custom URL schemes such as `obsidian://...`

## Supported image types for Image property

- Internal image links in the vault
- External image URLs
- Hex colors (`#RRGGBB`, `#RGB`, `#RRGGBBAA`) for color covers

When an image property is configured but a note has no image value, the card still renders the image frame like the built-in cards view.

## Usage

1. Build and install the plugin in your vault.
2. Open a `.base` file.
3. Select **Action Cards** in the view picker.
4. In view options, set:
   - **Image property** (optional)
   - **Link property** (optional)
   - **Card size**
   - **Image fit**
   - **Image aspect ratio**
5. Use the Bases **Properties** controls to decide which properties appear on each card.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Manual install for testing:

Copy `main.js`, `manifest.json`, and `styles.css` to:

```text
<Vault>/.obsidian/plugins/obsidian-bases-action-cards/
```

Then reload Obsidian and enable the plugin in **Settings → Community plugins**.
