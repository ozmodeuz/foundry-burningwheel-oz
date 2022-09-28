export async function task022() {
    // add shade to all weapons
    const actors = Array.from(game.actors?.values() || []);
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values())) {
            // also, the typo in the item type 'possession' has been fixed
            // any existing items need to be updated to match the new type
            if (["melee weapon", "ranged weapon", "armor"].indexOf(ownedItem.type) !== -1) {
                await ownedItem.update({ data: { shade: "B" } }, {});
            }
        }
    }
    const packs = Array.from(game.packs?.values() || []);
    for (const pack of packs) {
        if (pack.documentName === "Item") {
            const packItems = await pack.getDocuments();
            for (const item of packItems) {
                if (["melee weapon", "ranged weapon", "armor"].indexOf(item.type) !== -1) {
                    item.data.type = "possession";
                    await item.update({ data: { shade: "B" } }, {});
                }
            }
        }
    }
}
