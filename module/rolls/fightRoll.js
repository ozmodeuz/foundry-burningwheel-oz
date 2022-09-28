import { handleStatRoll } from "./rollStat.js";
import { notifyError } from "../helpers.js";
import { handleNpcStatRoll } from "./npcStatRoll.js";
import { handleSpellRoll } from "./rollSpell.js";
import { handleNpcSpellRoll, handleNpcWeaponRoll } from "./npcSkillRoll.js";
import { handleWeaponRoll } from "./rollWeapon.js";
import { handleAttrRoll } from "./rollAttribute.js";
export async function handleFightRoll({ actor, type, itemId, attackIndex, positionPenalty, engagementBonus, dataPreset }) {
    dataPreset = dataPreset || {};
    dataPreset.optionalDiceModifiers = dataPreset.optionalDiceModifiers || [];
    dataPreset.optionalDiceModifiers.push({
        dice: engagementBonus, optional: true, label: "Engagement Bonus",
    });
    dataPreset.optionalObModifiers = dataPreset.optionalObModifiers || [];
    dataPreset.optionalObModifiers.push({
        obstacle: positionPenalty, optional: true, label: "Weapon Disadvantage"
    });
    dataPreset.offerSplitPool = true,
        dataPreset.deedsPoint = actor.data.data.deeds !== 0,
        dataPreset.personaOptions = actor.data.data.persona ? Array.from(Array(Math.min(actor.data.data.persona, 3)).keys()) : undefined;
    if (type === "skill") {
        if (!itemId) {
            return notifyError("No Item Specified", "Item id must be specified when rolling an attack with a weapon or spell");
        }
        const item = actor.items.get(itemId);
        if (!item) {
            return notifyError("Missing Item", `Item linked  - id ${itemId} - appears not to exist on the actor's sheet.`);
        }
        switch (item.type) {
            case "melee weapon":
            case "ranged weapon":
                if (item.data.type === "melee weapon" && typeof attackIndex === 'undefined') {
                    throw Error("A Melee Weapon attack was given without specifying the melee attack index.");
                }
                // handle melee attack at the given index.
                const weapon = item;
                const weaponSkill = actor.items.get(weapon.data.data.skillId);
                if (!weaponSkill) {
                    return notifyError("No Associated Skill", "In order for a skill test to be rolled, a weapon or spell has to be associated with a skill. Check the Actor's sheet to make sure the selected weapon has a chosen skill.");
                }
                if (actor.data.type === "character") {
                    return handleWeaponRoll({
                        actor: actor,
                        weapon,
                        skill: weaponSkill,
                        attackIndex,
                        dataPreset
                    });
                }
                return handleNpcWeaponRoll({
                    actor: actor,
                    weapon,
                    skill: weaponSkill,
                    attackIndex,
                    dataPreset,
                });
            case "spell":
                const spell = actor.items.get(itemId);
                const skill = actor.items.get(spell?.data.data.skillId);
                if (actor.data.type === "character") {
                    return handleSpellRoll({ actor: actor, spell, skill, dataPreset });
                }
                return handleNpcSpellRoll({
                    actor: actor, spell, skill, dataPreset
                });
            default:
                throw Error(`Unexpected item type (${item.type}) passed to fight attack roll action`);
        }
    }
    // speed, power, or agility roll
    if (actor.data.type === "npc") {
        // npc specific code
        const dice = parseInt(getProperty(actor, `data.data.${type}.exp`));
        const shade = getProperty(actor, `data.data.${type}.shade`);
        return handleNpcStatRoll({
            dice,
            shade,
            open: false,
            statName: type,
            actor: actor,
            dataPreset
        });
    }
    const accessor = `data.${type}`;
    const stat = getProperty(actor, `data.${accessor}`);
    if (type === "steel") {
        return handleAttrRoll({
            actor: actor,
            stat: actor.data.data.steel,
            attrName: "Steel",
            accessor,
            dataPreset
        });
    }
    return handleStatRoll({
        actor: actor,
        statName: type.titleCase(),
        stat,
        accessor,
        dataPreset
    });
}
