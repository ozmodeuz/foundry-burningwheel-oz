export async function task041() {
    // add attack array to all weapons
    const actors = Array.from(game.actors?.values() || []);
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values())) {
            if (["melee weapon"].indexOf(ownedItem.type) !== -1) {
                const attackData = {
                    attackName: "",
                    power: parseInt(ownedItem.data.data.power),
                    add: parseInt(ownedItem.data.data.add),
                    vsArmor: parseInt(ownedItem.data.data.vsArmor),
                    weaponSpeed: ownedItem.data.data.weaponSpeed,
                    weaponLength: ownedItem.data.data.weaponLength
                };
                await ownedItem.update({ data: { attacks: [attackData] } }, {});
            }
        }
    }
    const packs = Array.from(game.packs?.values() || []);
    for (const pack of packs) {
        if (pack.documentName === "Item") {
            const packItems = await pack.getDocuments();
            for (const item of Array.from(packItems.values())) {
                if (["melee weapon"].indexOf(item.type) !== -1) {
                    const attackData = {
                        attackName: "",
                        power: parseInt(item.data.data.power),
                        add: parseInt(item.data.data.add),
                        vsArmor: parseInt(item.data.data.vsArmor),
                        weaponSpeed: item.data.data.weaponSpeed,
                        weaponLength: item.data.data.weaponLength
                    };
                    await item.update({ data: { attacks: [attackData] } }, {});
                }
            }
        }
    }
}
