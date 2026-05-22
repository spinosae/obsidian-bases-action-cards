import { Plugin } from "obsidian";
import {
BASES_LINK_CARDS_VIEW_ID,
basesLinkCardsViewRegistration,
} from "./view";

export default class BasesLinkCardsPlugin extends Plugin {
async onload(): Promise<void> {
const registered = this.registerBasesView(
BASES_LINK_CARDS_VIEW_ID,
basesLinkCardsViewRegistration,
);

if (!registered) {
console.warn(
"[obsidian-bases-link-cards] Bases is not enabled; custom view was not registered.",
);
}
}
}
