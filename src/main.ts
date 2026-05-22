import { Plugin } from "obsidian";
import {
BASES_ACTION_CARDS_VIEW_ID,
basesActionCardsViewRegistration,
} from "./view";

export default class BasesActionCardsPlugin extends Plugin {
async onload(): Promise<void> {
const registered = this.registerBasesView(
BASES_ACTION_CARDS_VIEW_ID,
basesActionCardsViewRegistration,
);

if (!registered) {
console.warn(
"[obsidian-bases-action-cards] Bases is not enabled; custom view was not registered.",
);
}
}
}
