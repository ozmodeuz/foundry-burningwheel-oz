import { skillImages } from "../constants.js";
export async function task063() {
    const items = Array.from(game.items?.values() || []).filter((i) => i.type === "skill" || i.type === "trait");
    const updateInfo = {};
    for (const item of items) {
        const updateData = updateItem(item, updateInfo);
        if (Object.values(updateData).length) {
            await item.update(updateData);
        }
    }
    const actors = Array.from(game.actors?.values() || []);
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values()).filter((i) => i.type === "skill" || i.type === "trait")) {
            const updateData = updateItem(ownedItem, updateInfo);
            if (Object.values(updateData).length) {
                await ownedItem.update(updateData);
            }
        }
    }
    const packs = Array.from(game.packs?.values() || []);
    for (const pack of packs) {
        if (pack.documentName === "Item") {
            const packItems = await pack.getDocuments();
            for (const item of Array.from(packItems.values()).filter((i) => i.type === "skill" || i.type === "trait")) {
                const updateData = updateItem(item, updateInfo);
                if (Object.values(updateData).length) {
                    await item.update(updateData);
                }
            }
        }
    }
    const updatedTypes = Object.keys(updateInfo);
    const parts = [];
    for (const types of updatedTypes) {
        parts.push(`${updateInfo[types]} ${types}s`);
    }
    const message = updatedTypes.length ? `Updated ${parts.join(", ")}.` : "No entities needed to be updated.";
    ui.notifications?.notify(message, "info");
}
function updateItem(item, updateInfo) {
    const data = {};
    if (item.data.img === "icons/svg/item-bag.svg") {
        if (item.data.type === "skill") {
            data["img"] = skillImages[item.data.data.skilltype];
        }
        else {
            data["img"] = traitImages[item.data.data.traittype];
        }
    }
    if (Object.values(data).length) {
        if (updateInfo[item.data.type]) {
            updateInfo[item.data.type]++;
        }
        else {
            updateInfo[item.data.type] = 1;
        }
    }
    return data;
}
const traitImages = {
    "character": "icons/sundries/gaming/rune-card.webp",
    "die": "icons/sundries/gaming/dice-runed-brown.webp",
    "call-on": "icons/sundries/gaming/playing-cards.webp"
};
