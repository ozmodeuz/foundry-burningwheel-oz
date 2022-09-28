import { getImage } from "./Macro.js";
export function CreateEditMacro(data) {
    if (!data.actorId) {
        return null;
    }
    const itemData = data.data;
    return {
        name: `Edit ${itemData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.showOwnedItem("${data.actorId}", "${data.id}");`,
        img: getImage(itemData.img, itemData.type)
    };
}
export function RollEditMacro(actorId, itemId) {
    const actor = game.actors?.find(a => a.id === actorId);
    if (!actor) {
        ui.notifications?.notify("Unable to find actor linked to this macro. Were they deleted?", "error");
        return;
    }
    const item = actor.items.get(itemId);
    if (!item) {
        ui.notifications?.notify("Unable to find item linked to this macro. Was it deleted?", "error");
        return;
    }
    item.sheet?.render(true);
}
