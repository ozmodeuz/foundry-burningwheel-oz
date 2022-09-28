import { simpleBroadcast } from "../chat.js";
import { BWItem } from "./item.js";
export class Instinct extends BWItem {
    async generateChatMessage(actor) {
        const data = {
            title: this.name,
            mainText: this.data.data.text,
            extraData: [
                {
                    title: `Spent Artha`,
                    text: `Fate: ${this.data.data.fateSpent || 0}; Persona: ${this.data.data.personaSpent || 0}; Deeds: ${this.data.data.deedsSpent || 0}`
                }
            ]
        };
        return simpleBroadcast(data, actor);
    }
}
