import {
App,
BasesEntry,
BasesPropertyId,
BasesView,
BasesViewConfig,
BasesViewRegistration,
	FileValue,
	LinkValue,
	ListValue,
	Notice,
NullValue,
QueryController,
RenderContext,
StringValue,
TFile,
UrlValue,
Value,
ViewOption,
} from "obsidian";

export const BASES_CARDS_REDIRECT_VIEW_ID = "cards-redirect";

const IMAGE_PROPERTY_OPTION_KEY = "imageProperty";
const LINK_PROPERTY_OPTION_KEY = "linkProperty";
const CARD_SIZE_OPTION_KEY = "cardSize";
const IMAGE_FIT_OPTION_KEY = "imageFit";
const IMAGE_ASPECT_RATIO_OPTION_KEY = "imageAspectRatio";

const DEFAULT_CARD_SIZE = 240;
const DEFAULT_IMAGE_FIT = "cover";
const DEFAULT_IMAGE_ASPECT_RATIO = "1 / 1";
const CARD_TITLE_PROPERTY_IDS = new Set<BasesPropertyId>([
	"file.name",
	"file.basename",
]);
const IMAGE_FIT_OPTIONS: Record<string, string> = {
	cover: "Cover",
	contain: "Contain",
};
const IMAGE_ASPECT_RATIO_OPTIONS: Record<string, string> = {
	"1 / 1": "1:1",
	"4 / 3": "4:3",
	"3 / 2": "3:2",
	"16 / 9": "16:9",
};

export const basesCardsRedirectViewRegistration: BasesViewRegistration = {
name: "Cards (redirect)",
icon: "gallery-horizontal",
factory: (controller, containerEl) => new BasesCardsRedirectView(controller, containerEl),
	options: (): ViewOption[] => [
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
{
key: CARD_SIZE_OPTION_KEY,
type: "slider",
displayName: "Card size",
default: DEFAULT_CARD_SIZE,
min: 180,
max: 360,
step: 20,
instant: true,
},
		{
			key: IMAGE_FIT_OPTION_KEY,
			type: "dropdown",
			displayName: "Image fit",
			default: DEFAULT_IMAGE_FIT,
			options: IMAGE_FIT_OPTIONS,
			shouldHide: (config) => !config.getAsPropertyId(IMAGE_PROPERTY_OPTION_KEY),
		},
		{
			key: IMAGE_ASPECT_RATIO_OPTION_KEY,
			type: "dropdown",
			displayName: "Image aspect ratio",
			default: DEFAULT_IMAGE_ASPECT_RATIO,
			options: IMAGE_ASPECT_RATIO_OPTIONS,
			shouldHide: (config) => !config.getAsPropertyId(IMAGE_PROPERTY_OPTION_KEY),
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
const visibleProperties = getVisibleCardProperties(this.config, imageProperty);

this.containerEl.empty();
this.containerEl.addClass("bases-cards-redirect-view");
this.applyViewOptions(this.config);

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
this.renderCard(gridEl, entry, visibleProperties, imageProperty);
}
}
}

private applyViewOptions(config: BasesViewConfig): void {
const cardSize = getNumberOption(config.get(CARD_SIZE_OPTION_KEY), DEFAULT_CARD_SIZE);
const imageFit = getStringOption(config.get(IMAGE_FIT_OPTION_KEY), DEFAULT_IMAGE_FIT);
const imageAspectRatio = getStringOption(
config.get(IMAGE_ASPECT_RATIO_OPTION_KEY),
DEFAULT_IMAGE_ASPECT_RATIO,
);

this.containerEl.style.setProperty("--bases-cards-redirect-card-size", `${cardSize}px`);
this.containerEl.style.setProperty("--bases-cards-redirect-image-fit", imageFit);
this.containerEl.style.setProperty(
"--bases-cards-redirect-image-aspect-ratio",
imageAspectRatio,
);
}

private renderCard(
gridEl: HTMLElement,
entry: BasesEntry,
visibleProperties: BasesPropertyId[],
imageProperty: BasesPropertyId | null,
): void {
const cardEl = gridEl.createDiv({ cls: "bases-cards-redirect-card" });
cardEl.tabIndex = 0;
cardEl.setAttribute("role", "button");
cardEl.setAttribute("aria-label", `Open ${entry.file.basename}`);

cardEl.addEventListener("click", (event) => {
const target = event.target;
if (target instanceof HTMLElement && target.closest("a")) {
	return;
}
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

const renderedAnyProperty = this.renderVisibleProperties(bodyEl, entry, visibleProperties);
cardEl.toggleClass("bases-cards-redirect-card--properties", renderedAnyProperty);
}

private renderVisibleProperties(
bodyEl: HTMLElement,
entry: BasesEntry,
visibleProperties: BasesPropertyId[],
): boolean {
if (visibleProperties.length === 0) {
return false;
}

const propertyListEl = bodyEl.createDiv({ cls: "bases-cards-redirect-card-properties" });
let renderedAnyProperty = false;

for (const propertyId of visibleProperties) {
renderedAnyProperty = true;
const propertyName = this.config.getDisplayName(propertyId);
const itemEl = propertyListEl.createDiv({ cls: "bases-cards-redirect-property" });
itemEl.createSpan({
cls: "bases-cards-redirect-property-name",
text: propertyName,
});

const valueEl = itemEl.createSpan({ cls: "bases-cards-redirect-property-value" });
const value = entry.getValue(propertyId);
if (!value || value instanceof NullValue) {
valueEl.setText("—");
valueEl.addClass("bases-cards-redirect-property-value--null");
valueEl.setAttribute("aria-label", `${propertyName}: empty`);
continue;
}

try {
value.renderTo(valueEl, new RenderContext());
} catch {
valueEl.setText(value.toString());
}

const displayValue = valueEl.textContent?.trim() ?? "";
if (!displayValue) {
valueEl.setText("—");
valueEl.addClass("bases-cards-redirect-property-value--null");
valueEl.setAttribute("aria-label", `${propertyName}: empty`);
continue;
}
valueEl.setAttribute("aria-label", `${propertyName}: ${displayValue}`);
}

if (!renderedAnyProperty) {
propertyListEl.remove();
}

return renderedAnyProperty;
}

private renderCardMedia(
cardEl: HTMLElement,
entry: BasesEntry,
imageProperty: BasesPropertyId | null,
): void {
if (!imageProperty) {
return;
}

const mediaEl = cardEl.createDiv({ cls: "bases-cards-redirect-card-media" });
const mediaSource = extractImageSource(this.app, entry, entry.getValue(imageProperty));
if (!mediaSource) {
mediaEl.addClass("bases-cards-redirect-card-media--empty");
return;
}

if (mediaSource.type === "color") {
mediaEl.style.backgroundColor = mediaSource.value;
return;
}

const imageEl = mediaEl.createEl("img", {
cls: "bases-cards-redirect-card-image",
attr: {
src: mediaSource.value,
alt: `${entry.file.basename} cover image`,
loading: "lazy",
},
});
imageEl.addEventListener("error", () => {
imageEl.remove();
mediaEl.addClass("bases-cards-redirect-card-media--empty");
});
}

private async openCardTarget(entry: BasesEntry): Promise<void> {
const linkProperty = this.config.getAsPropertyId(LINK_PROPERTY_OPTION_KEY);
if (!linkProperty) {
await this.openEntryFile(entry);
return;
}

const linkTarget = resolveLinkTarget(this.app, entry, entry.getValue(linkProperty));
if (linkTarget.kind === "empty") {
await this.openEntryFile(entry);
return;
}

if (linkTarget.kind === "invalid") {
new Notice(linkTarget.message);
return;
}

if (linkTarget.kind === "external") {
window.open(linkTarget.url, "_blank");
return;
}

await this.app.workspace.openLinkText(linkTarget.linktext, entry.file.path, false);
}

private async openEntryFile(entry: BasesEntry): Promise<void> {
const leaf = this.app.workspace.getLeaf(false);
await leaf.openFile(entry.file);
}
}

type MediaSource =
| { type: "image"; value: string }
| { type: "color"; value: string };

type ScalarValue = {
raw: string;
kind: "link" | "url" | "file" | "string" | "other";
};

type LinkTarget =
| { kind: "empty" }
| { kind: "external"; url: string }
| { kind: "internal"; linktext: string }
| { kind: "invalid"; message: string };

type ParsedLink =
| { kind: "internal"; target: string; explicit: boolean }
| { kind: "external"; target: string };

function getVisibleCardProperties(
	config: BasesViewConfig,
	imageProperty: BasesPropertyId | null,
): BasesPropertyId[] {
	return config.getOrder().filter((propertyId) => (
		propertyId !== imageProperty
		&& !CARD_TITLE_PROPERTY_IDS.has(propertyId)
	));
}

function extractImageSource(
app: App,
entry: BasesEntry,
value: Value | null,
): MediaSource | null {
const scalarValue = getFirstScalarValue(value);
if (!scalarValue) {
return null;
}

if (isHexColor(scalarValue.raw)) {
return { type: "color", value: scalarValue.raw };
}

const parsedLink = parseStructuredLink(scalarValue.raw, scalarValue.kind !== "string");
if (!parsedLink) {
return null;
}

if (parsedLink.kind === "external") {
return { type: "image", value: parsedLink.target };
}

const resolved = resolveInternalFile(app, parsedLink.target, entry.file.path);
if (!resolved) {
return null;
}

return { type: "image", value: app.vault.getResourcePath(resolved) };
}

function resolveLinkTarget(app: App, entry: BasesEntry, value: Value | null): LinkTarget {
const scalarValue = getFirstScalarValue(value);
if (!scalarValue) {
return { kind: "empty" };
}

const parsedLink = parseStructuredLink(scalarValue.raw, scalarValue.kind !== "string");
if (!parsedLink) {
return {
kind: "invalid",
message: `Link property on “${entry.file.basename}” is not a valid Obsidian link or URL.`,
};
}

if (parsedLink.kind === "external") {
if (!isValidExternalLink(parsedLink.target)) {
return {
kind: "invalid",
message: `Link property on “${entry.file.basename}” contains an invalid URL: ${scalarValue.raw}`,
};
}

return { kind: "external", url: parsedLink.target };
}

if (!parsedLink.explicit) {
const resolved = resolveInternalFile(app, parsedLink.target, entry.file.path);
if (!resolved) {
return {
kind: "invalid",
message: `Link property on “${entry.file.basename}” must use a valid Obsidian link, file path, or URL.`,
};
}
return { kind: "internal", linktext: resolved.path };
}

return { kind: "internal", linktext: parsedLink.target };
}

function getFirstScalarValue(value: Value | null): ScalarValue | null {
if (!value) {
return null;
}

	if (value instanceof ListValue) {
		for (let i = 0; i < value.length(); i += 1) {
			const nested = getFirstScalarValue(value.get(i));
			if (nested) {
				return nested;
			}
		}
return null;
}

const raw = value.toString().trim();
if (!raw) {
return null;
}

if (value instanceof LinkValue) {
return { raw, kind: "link" };
}
if (value instanceof UrlValue) {
return { raw, kind: "url" };
}
if (value instanceof FileValue) {
return { raw, kind: "file" };
}
if (value instanceof StringValue) {
return { raw, kind: "string" };
}

return { raw, kind: "other" };
}

function parseStructuredLink(rawValue: string, allowBareInternalPath: boolean): ParsedLink | null {
const trimmed = rawValue.trim();
if (!trimmed) {
return null;
}

const wikilinkMatch = trimmed.match(/^!?\[\[([^\]]+)\]\]$/u);
if (wikilinkMatch?.[1]) {
const [target] = wikilinkMatch[1].split("|");
const normalizedTarget = target?.trim();
if (normalizedTarget) {
return { kind: "internal", target: normalizedTarget, explicit: true };
}
return null;
}

const markdownLinkMatch = trimmed.match(/^!?\[[^\]]*\]\(([^)]+)\)$/u);
if (markdownLinkMatch?.[1]) {
const normalizedTarget = markdownLinkMatch[1].trim().replace(/^<|>$/gu, "");
if (!normalizedTarget) {
return null;
}
if (isExternalOrProtocolLink(normalizedTarget)) {
return {
kind: "external",
target: normalizeExternalLink(normalizedTarget),
};
}
return { kind: "internal", target: normalizedTarget, explicit: true };
}

if (isExternalOrProtocolLink(trimmed)) {
return {
kind: "external",
target: normalizeExternalLink(trimmed),
};
}

if (allowBareInternalPath && isLikelyInternalPath(trimmed)) {
return { kind: "internal", target: trimmed, explicit: false };
}

return null;
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

function getNumberOption(value: unknown, fallback: number): number {
return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStringOption(value: unknown, fallback: string): string {
return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function isLikelyInternalPath(value: string): boolean {
return value.includes("/") || value.includes("#") || value.endsWith(".md");
}

function isExternalOrProtocolLink(value: string): boolean {
if (value.startsWith("www.")) {
return true;
}

return /^[a-zA-Z][a-zA-Z0-9+.-]*:/u.test(value);
}

function normalizeExternalLink(value: string): string {
return value.startsWith("www.") ? `https://${value}` : value;
}

function isValidExternalLink(value: string): boolean {
try {
new URL(value);
return true;
} catch {
return false;
}
}

function isHexColor(value: string): boolean {
return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/u.test(value);
}
