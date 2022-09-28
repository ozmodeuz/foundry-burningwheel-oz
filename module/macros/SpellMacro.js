import { getImage, getMacroRollPreset } from "./Macro.js";
import { handleNpcSpellRoll } from "../rolls/npcSkillRoll.js";
import { handleSpellRoll } from "../rolls/rollSpell.js";
export function CreateSpellRollMacro(data) {
    if (!data.actorId) {
        return null;
    }
    const spellData = data.data;
    return {
        name: `Cast ${spellData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollSpell("${data.actorId}", "${data.id}");`,
        img: getImage(spellData.img, "spell")
    };
}
export function RollSpellMacro(actorId, spellId) {
    const actor = game.actors?.find(a => a.id === actorId);
    if (!actor) {
        ui.notifications?.notify("Unable to find actor linked to this macro. Were they deleted?", "error");
        return;
    }
    const spell = actor.items.get(spellId);
    if (!spell) {
        ui.notifications?.notify("Unable to find spell linked to this macro. Was it deleted?", "error");
        return;
    }
    const skill = actor.items.get(spell.data.data.skillId);
    if (!skill) {
        ui.notifications?.notify("Unable to find skill linked to the spell in this macro. Ensure a sorcerous skill is linked with this spell.", "error");
        return;
    }
    const dataPreset = getMacroRollPreset(actor);
    if (actor.data.type === "character") {
        handleSpellRoll({ actor: actor, skill, spell, dataPreset });
    }
    else {
        handleNpcSpellRoll({ actor: actor, skill, spell, dataPreset });
    }
}
