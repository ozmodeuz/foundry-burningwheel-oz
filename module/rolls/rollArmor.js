import { rollDice, templates, extractNumber, getRollNameClass, buildRerollData, extractBaseData, buildDiceSourceObject } from "./rolls.js";
import * as helpers from "../helpers.js";
export async function handleArmorRollEvent({ target, sheet }) {
    const actor = sheet.actor;
    const armorId = target.dataset.itemId || "";
    const armorItem = actor.items.get(armorId);
    const location = target.dataset.location || "";
    const chestBonus = location.toLowerCase() === "torso" ? 1 : 0;
    const damage = armorItem?.data.data[`damage${location}`];
    const dialogData = {
        difficulty: 1,
        name: "Armor",
        arthaDice: 0,
        bonusDice: 0,
        armor: (armorItem?.data.data.dice || 0) + chestBonus,
        damage,
        showObstacles: true,
        showDifficulty: true,
    };
    const html = await renderTemplate(templates.armorDialog, dialogData);
    return new Dialog({
        title: "Roll Armor Dice",
        content: html,
        buttons: {
            roll: {
                label: "Roll",
                callback: (html) => armorRollCallback(armorItem, html, sheet, location)
            }
        },
        default: "roll"
    }).render(true);
}
export async function armorRollCallback(armorItem, html, sheet, location) {
    const dice = extractNumber(html, "armor");
    const damage = parseInt(armorItem.data.data[`damage${location}`]);
    const va = extractNumber(html, "vsArmor");
    const actor = armorItem.actor;
    const baseData = extractBaseData(html, sheet);
    const dieSources = {
        Armor: `+${dice}`,
    };
    if (damage) {
        dieSources.Damage = `-${damage}`;
    }
    const numDice = dice - damage;
    const roll = await rollDice(numDice, false, armorItem.data.data.shade || "B");
    if (!roll) {
        return;
    }
    const damageAssigned = await armorItem.assignDamage(roll, location);
    const isSuccess = (roll.total || 0) >= 1 + va;
    const rerollData = buildRerollData({ actor, roll, itemId: armorItem.id });
    rerollData.type = "armor";
    const messageData = {
        name: "Armor",
        successes: "" + roll.dice[0].total,
        success: isSuccess,
        rolls: roll.dice[0].results,
        difficulty: 1 + va,
        nameClass: getRollNameClass(false, armorItem.data.data.shade || "B"),
        difficultyGroup: "N/A",
        obstacleTotal: 1 + va,
        callons: [],
        fateReroll: rerollData,
        dieSources: {
            ...dieSources,
            ...buildDiceSourceObject(0, baseData.aDice, baseData.bDice, 0, 0, 0)
        },
        extraInfo: damageAssigned ? `${armorItem.name} ${helpers.deCamelCaseify(location).toLowerCase()} lost ${damageAssigned} ${damageAssigned > 1 ? 'dice' : 'die'} to damage.` : undefined
    };
    const messageHtml = await renderTemplate(templates.armorMessage, messageData);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor: armorItem.actor })
    });
}
