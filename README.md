# Bases cards redirect

A custom Obsidian Bases view that mimics cards layout while letting you customize card click behavior.

## What it does

This plugin registers a Bases view named **Cards (redirect)**.

It behaves like cards view, with two configurable options:

- **Image property**: controls the card cover (similar to built-in cards)
- **Link property**: when set and valid, clicking a card opens this link instead of the note

If **Link property** is not set, empty, or invalid, clicking opens the note file as usual.

## Supported link types for Link property

The view supports links commonly used in Obsidian properties:

- Internal links to notes/files (`[[Note]]`, `[[Folder/File.md]]`)
- Markdown links (`[label](target)`)
- Website URLs (`https://example.com`, `http://...`, `www...`)
- Custom URL schemes such as `obsidian://...`

## Supported image types for Image property

- Internal image links in the vault
- External image URLs
- Hex colors (`#RRGGBB`, `#RGB`, `#RRGGBBAA`) for color covers

## Usage

1. Build and install the plugin in your vault.
2. Open a `.base` file.
3. Select **Cards (redirect)** in the view picker.
4. In view options, set:
   - **Image property** (optional)
   - **Link property** (optional)

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
<Vault>/.obsidian/plugins/obsidian-bases-cards-redirect/
```

Then reload Obsidian and enable the plugin in **Settings → Community plugins**.
