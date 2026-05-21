import {
	App,
	BasesEntry,
	BasesPropertyId,
	BasesView,
	BasesViewRegistration,
	FileValue,
	LinkValue,
	ListValue,
	Notice,
	QueryController,
	StringValue,
	TFile,
	UrlValue,
	Value,
} from "obsidian";

export const BASES_CARDS_REDIRECT_VIEW_ID = "cards-redirect";

const IMAGE_PROPERTY_OPTION_KEY = "imageProperty";
const LINK_PROPERTY_OPTION_KEY = "linkProperty";

export const basesCardsRedirectViewRegistration: BasesViewRegistration = {
name: "Cards (redirect)",
icon: "gallery-horizontal",
factory: (controller, containerEl) =>
new BasesCardsRedirectView(controller, containerEl),
options: () => [
{
key: IMAGE_PROPERTY_OPTION_KEY,
type: "property",
displayName: "Image property",
placeholder: "Select a property",
},
{
key: LINK_PROPERTY_OPTION_KEY,
type: "property",
displayName: "Link property",
placeholder: "Select a property",
},
],
};

class BasesCardsRedirectView extends BasesView {
type = BASES_CARDS_REDIRECT_VIEW_ID;

private readonly containerEl: HTMLElement;

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller);
		this.containerEl = containerEl;
	}

onDataUpdated(): void {
const imageProperty = this.config.getAsPropertyId(IMAGE_PROPERTY_OPTION_KEY);
const groupedData = this.data.groupedData;
const orderedProperties = this.config.getOrder();

this.containerEl.empty();
this.containerEl.addClass("bases-cards-redirect-view");

for (const group of groupedData) {
const sectionEl = this.containerEl.createDiv({
cls: "bases-cards-redirect-section",
});

if (group.hasKey()) {
sectionEl.createEl("h3", {
cls: "bases-cards-redirect-group-title",
text: group.key?.toString() ?? "",
});
}

const gridEl = sectionEl.createDiv({ cls: "bases-cards-redirect-grid" });
for (const entry of group.entries) {
this.renderCard(gridEl, entry, orderedProperties, imageProperty);
}
}
}

private renderCard(
gridEl: HTMLElement,
entry: BasesEntry,
orderedProperties: BasesPropertyId[],
imageProperty: BasesPropertyId | null,
): void {
const cardEl = gridEl.createDiv({ cls: "bases-cards-redirect-card" });
cardEl.tabIndex = 0;
cardEl.setAttribute("role", "button");
cardEl.setAttribute("aria-label", `Open ${entry.file.basename}`);

cardEl.addEventListener("click", () => {
void this.openCardTarget(entry);
});
cardEl.addEventListener("keydown", (event) => {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
void this.openCardTarget(entry);
}
});

this.renderCardMedia(cardEl, entry, imageProperty);

const bodyEl = cardEl.createDiv({ cls: "bases-cards-redirect-card-body" });
bodyEl.createEl("div", {
cls: "bases-cards-redirect-card-title",
text: entry.file.basename,
});

const propertyIds = orderedProperties.length > 0 ? orderedProperties : this.data.properties;
const propertyListEl = bodyEl.createDiv({ cls: "bases-cards-redirect-card-properties" });

for (const propertyId of propertyIds) {
const value = entry.getValue(propertyId);
if (!value) {
continue;
}

const displayValue = value.toString().trim();
if (!displayValue) {
continue;
}

const itemEl = propertyListEl.createDiv({ cls: "bases-cards-redirect-property" });
itemEl.createSpan({
cls: "bases-cards-redirect-property-name",
text: `${this.config.getDisplayName(propertyId)}:`,
});
itemEl.createSpan({
cls: "bases-cards-redirect-property-value",
text: displayValue,
});
}
}

private renderCardMedia(
cardEl: HTMLElement,
entry: BasesEntry,
imageProperty: BasesPropertyId | null,
): void {
if (!imageProperty) {
return;
}

const mediaSource = extractImageSource(
this.app,
entry,
entry.getValue(imageProperty),
);
if (!mediaSource) {
return;
}

if (mediaSource.type === "color") {
const colorEl = cardEl.createDiv({ cls: "bases-cards-redirect-card-image" });
colorEl.style.backgroundColor = mediaSource.value;
return;
}

const imageEl = cardEl.createEl("img", {
cls: "bases-cards-redirect-card-image",
attr: {
src: mediaSource.value,
alt: `${entry.file.basename} cover image`,
loading: "lazy",
},
});
imageEl.addEventListener("error", () => imageEl.remove());
}

	private async openCardTarget(entry: BasesEntry): Promise<void> {
		const linkProperty = this.config.getAsPropertyId(LINK_PROPERTY_OPTION_KEY);
		if (!linkProperty) {
			await this.openEntryFile(entry);
			return;
		}

		const redirectTarget = getLinkTarget(entry.getValue(linkProperty));
		if (!redirectTarget) {
			await this.openEntryFile(entry);
			return;
		}

if (isExternalOrProtocolLink(redirectTarget)) {
window.open(redirectTarget, "_blank");
return;
}

		try {
			await this.app.workspace.openLinkText(redirectTarget, entry.file.path, false);
		} catch {
			new Notice(`Unable to open link: ${redirectTarget}`);
			await this.openEntryFile(entry);
		}
	}

	private async openEntryFile(entry: BasesEntry): Promise<void> {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(entry.file);
	}
}

type MediaSource =
| { type: "image"; value: string }
| { type: "color"; value: string };

function extractImageSource(
app: App,
entry: BasesEntry,
value: Value | null,
): MediaSource | null {
const raw = getFirstScalarValue(value);
if (!raw) {
return null;
}

if (isHexColor(raw)) {
return { type: "color", value: raw };
}

const parsedLink = parseSupportedLink(raw);
if (!parsedLink) {
return null;
}

if (isExternalOrProtocolLink(parsedLink) || isRootRelativeResource(parsedLink)) {
return { type: "image", value: parsedLink };
}

const resolved = resolveInternalFile(app, parsedLink, entry.file.path);
if (!resolved) {
return null;
}

return { type: "image", value: app.vault.getResourcePath(resolved) };
}

function getLinkTarget(value: Value | null): string | null {
const raw = getFirstScalarValue(value);
if (!raw) {
return null;
}

const parsed = parseSupportedLink(raw);
if (!parsed) {
return null;
}

if (isExternalOrProtocolLink(parsed) || isRootRelativeResource(parsed)) {
return parsed;
}

return parsed;
}

function getFirstScalarValue(value: Value | null): string | null {
if (!value) {
return null;
}

if (value instanceof ListValue) {
for (let index = 0; index < value.length(); index += 1) {
const nested = getFirstScalarValue(value.get(index));
if (nested) {
return nested;
}
}
return null;
}

if (
value instanceof LinkValue
|| value instanceof UrlValue
|| value instanceof StringValue
|| value instanceof FileValue
) {
const rendered = value.toString().trim();
return rendered.length > 0 ? rendered : null;
}

const fallback = value.toString().trim();
return fallback.length > 0 ? fallback : null;
}

function parseSupportedLink(rawValue: string): string | null {
const trimmed = rawValue.trim();
if (!trimmed) {
return null;
}

const wikilinkMatch = trimmed.match(/^!?\[\[([^\]]+)\]\]$/u);
if (wikilinkMatch?.[1]) {
const [target] = wikilinkMatch[1].split("|");
return target?.trim() || null;
}

const markdownLinkMatch = trimmed.match(/^!?\[[^\]]*\]\(([^)]+)\)$/u);
if (markdownLinkMatch?.[1]) {
const unwrapped = markdownLinkMatch[1].trim().replace(/^<|>$/gu, "");
return unwrapped || null;
}

return trimmed;
}

function resolveInternalFile(app: App, link: string, sourcePath: string): TFile | null {
const path = link.trim();
if (!path) {
return null;
}

const direct = app.vault.getAbstractFileByPath(path);
if (direct instanceof TFile) {
return direct;
}

const destination = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
if (destination instanceof TFile) {
return destination;
}

return null;
}

function isRootRelativeResource(value: string): boolean {
return value.startsWith("/") || value.startsWith("./") || value.startsWith("../");
}

function isExternalOrProtocolLink(value: string): boolean {
if (value.startsWith("www.")) {
return true;
}

return /^[a-zA-Z][a-zA-Z0-9+.-]*:/u.test(value);
}

function isHexColor(value: string): boolean {
return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/u.test(value);
}
