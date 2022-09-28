import { BWCharacterSheet } from "./BWCharacterSheet.js";
export class BWCharacterTabbedSheet extends BWCharacterSheet {
    get template() {
        const path = "systems/burningwheel/templates";
        return `${path}/${this.actor.data.type}-tabbed-sheet.hbs`;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.tabs = [
            { navSelector: ".tabs", contentSelector: ".content", initial: "BITs" }
        ];
        return options;
    }
}
