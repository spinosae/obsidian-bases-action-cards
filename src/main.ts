import { Plugin } from "obsidian";
import {
BASES_CARDS_REDIRECT_VIEW_ID,
basesCardsRedirectViewRegistration,
} from "./view";

export default class BasesCardsRedirectPlugin extends Plugin {
async onload(): Promise<void> {
const registered = this.registerBasesView(
BASES_CARDS_REDIRECT_VIEW_ID,
basesCardsRedirectViewRegistration,
);

if (!registered) {
console.warn(
"[obsidian-bases-cards-redirect] Bases is not enabled; custom view was not registered.",
);
}
}
}
