import * as helpers from "../helpers.js";
import { handleAttrRollEvent } from "./rollAttribute.js";
import { handleCirclesRollEvent } from "./rollCircles.js";
import { handleLearningRollEvent } from "./rollLearning.js";
import { handleGritRollEvent, handleShrugRollEvent } from "./rollPtgs.js";
import { handleResourcesRollEvent } from "./rollResources.js";
import { handleSkillRollEvent } from "./rollSkill.js";
import { handleStatRollEvent } from "./rollStat.js";
import { handleArmorRollEvent } from "./rollArmor.js";
import { handleWeaponRollEvent } from "./rollWeapon.js";
import { handleSpellRollEvent } from "./rollSpell.js";
import { handleSpellTaxRoll } from "./rollSpellTax.js";
export async function handleRollable(e, sheet) {
    const target = e.currentTarget;
    const rollType = target.dataset.rollType;
    const dataPreset = getKeypressModifierPreset(e);
    dataPreset.deedsPoint = sheet.actor.data.data.deeds !== 0;
    if (sheet.actor.data.data.persona) {
        dataPreset.personaOptions = Array.from(Array(Math.min(sheet.actor.data.data.persona, 3)).keys());
    }
    switch (rollType) {
        case "skill":
            return handleSkillRollEvent({ target, sheet, dataPreset });
        case "stat":
            return handleStatRollEvent({ target, sheet, dataPreset });
        case "circles":
            return handleCirclesRollEvent({ target, sheet, dataPreset });
        case "attribute":
            return handleAttrRollEvent({ target, sheet, dataPreset });
        case "resources":
            return handleResourcesRollEvent({ target, sheet, dataPreset });
        case "learning":
            return handleLearningRollEvent({ target, sheet, dataPreset });
        case "shrug":
            if (sheet.actor.data.data.ptgs.shrugging) {
                return sheet.actor.update({ "data.ptgs.shrugging": false });
            }
            return handleShrugRollEvent({ target, sheet, dataPreset });
        case "grit":
            if (sheet.actor.data.data.ptgs.gritting) {
                return sheet.actor.update({ "data.ptgs.gritting": false });
            }
            return handleGritRollEvent({ target, sheet, dataPreset });
        case "weapon":
            return handleWeaponRollEvent({ target, sheet, dataPreset });
        case "spell":
            return handleSpellRollEvent({ target, sheet, dataPreset });
        case "armor":
            return handleArmorRollEvent({ target, sheet });
        case "spellTax":
            return handleSpellTaxRoll(target, sheet, dataPreset);
    }
}
export function getKeypressModifierPreset(e) {
    const dataPreset = {};
    if (e.shiftKey) {
        dataPreset.showObstacles = true;
        dataPreset.showDifficulty = true;
        dataPreset.useCustomDifficulty = true;
    }
    if (e.ctrlKey || e.metaKey) {
        dataPreset.offerSplitPool = true;
    }
    if (e.altKey) {
        dataPreset.addHelp = true;
    }
    if (game.burningwheel.gmDifficulty) {
        const dialog = game.burningwheel.gmDifficulty;
        const mods = game.burningwheel.modifiers;
        if (dialog.splitPool) {
            dataPreset.offerSplitPool = true;
            dialog.splitPool = false;
        }
        if (dialog.customDiff) {
            dataPreset.showObstacles = true;
            dataPreset.showDifficulty = true;
            dataPreset.useCustomDifficulty = true;
            dialog.customDiff = false;
        }
        if (dialog.help) {
            dataPreset.addHelp = true;
            dialog.help = false;
        }
        dataPreset.optionalObModifiers = mods.mods.map(m => { return { obstacle: m.amount, label: m.name, optional: true }; });
        dialog.render();
    }
    return dataPreset;
}
/* ================================================= */
/*               Helper functions                    */
/* ================================================= */
export function buildDiceSourceObject(exp, aDice, bDice, forks, woundDice, tax) {
    const dieSources = {};
    if (exp) {
        dieSources.Exponent = `+${exp}`;
    }
    if (aDice) {
        dieSources.Artha = `+${aDice}`;
    }
    if (bDice) {
        dieSources.Bonus = `+${bDice}`;
    }
    if (forks) {
        dieSources.FoRKs = `+${forks}`;
    }
    if (woundDice) {
        dieSources["Wound Penalty"] = `-${woundDice}`;
    }
    if (tax) {
        dieSources.Tax = `-${tax}`;
    }
    return dieSources;
}
export function buildRerollData({ actor, roll, accessor, splitPoolRoll, itemId }) {
    const coreData = {
        dice: roll.dice[0].results.map(r => r.result).join(","),
        splitDice: splitPoolRoll?.dice[0].results.map(r => r.result).join(",") || undefined,
        actorId: actor.id,
    };
    if (accessor) {
        return {
            accessor,
            type: "stat",
            ...coreData
        };
    }
    else {
        return {
            itemId,
            type: "skill",
            ...coreData
        };
    }
}
export function extractBaseData(html, sheet) {
    const exponent = extractNumber(html, "stat.exp");
    const actorData = sheet.actor.data;
    const woundDice = extractNumber(html, "woundDice") || 0;
    const obPenalty = actorData.data.ptgs.obPenalty || 0;
    let penaltySources = obPenalty ? { "Wound Penalty": `+${obPenalty}` } : {};
    const miscDice = extractMiscDice(html);
    const miscObs = extractMiscObs(html);
    penaltySources = { ...penaltySources, ...miscObs.entries };
    const diff = extractNumber(html, "difficulty");
    const aDice = extractNumber(html, "arthaDice");
    const bDice = extractNumber(html, "bonusDice");
    const obstacleTotal = diff + obPenalty + miscObs.sum;
    return { exponent, woundDice, obPenalty, diff, aDice, bDice, miscDice, penaltySources, obstacleTotal };
}
export function extractSelectString(html, name) {
    return html.find(`select[name="${name}"]`).val();
}
export function extractSelectNumber(html, name) {
    return parseInt(extractSelectString(html, name) || "0", 10);
}
export function extractString(html, name) {
    return html.find(`input[name="${name}"]`).val();
}
export function extractNumber(html, name) {
    return parseInt(extractString(html, name) || "0", 10);
}
export function extractCheckboxValue(html, name) {
    let sum = 0;
    html.find(`input[name="${name}"]:checked`).each((_i, v) => {
        sum += parseInt(v.getAttribute("value") || "", 10);
    });
    return sum;
}
export function extractMiscDice(html) {
    let sum = 0;
    const entries = {};
    html.find('input[name="miscDice"]:checked').each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}
export function extractMiscObs(html) {
    let sum = 0;
    const entries = {};
    html.find('input[name="miscObs"]:checked').each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}
export async function rollDice(numDice, open = false, shade = 'B') {
    if (numDice <= 0) {
        getNoDiceErrorDialog(numDice);
        return;
    }
    else {
        const tgt = shade === 'B' ? '3' : (shade === 'G' ? '2' : '1');
        const roll = new Roll(`${numDice}d6${open ? 'x6' : ''}cs>${tgt}`).roll({ async: true });
        if (game.dice3d) {
            return game.dice3d.showForRoll(await roll, game.user, true, null, false)
                .then(_ => roll);
        }
        return roll;
    }
}
export function getRollNameClass(open, shade) {
    let css = "shade-black";
    if (shade === "G") {
        css = "shade-grey";
    }
    else if (shade === "W") {
        css = "shade-white";
    }
    if (open) {
        css += " open-roll";
    }
    return css;
}
export async function getNoDiceErrorDialog(numDice) {
    return helpers.notifyError("Too Few Dice", `Too few dice to be rolled. Must roll a minimum of one. Currently, bonuses and penalties add up to ${numDice}`);
}
export async function maybeExpendTools(tools) {
    const roll = await rollDice(1, false, "B");
    const result = roll?.dice[0].results[0].result;
    if (roll && result === 1) {
        return {
            expended: true,
            text: `<p>The die of fate result for toolkit used (${tools.name}) was a <label class="roll-die" data-success="false">${result}</label> and thus the kit is expended.</p>`
        };
    }
    return {
        expended: false,
        text: `<p>The die of fate result for the toolkit used (${tools.name}) was a <label class="roll-die" data-success="true">${result}</label></p>`
    };
}
function extractSourcedValue(html, name) {
    let sum = 0;
    const entries = {};
    html.find(`input[name="${name}"]:checked`).each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}
export function extractRollData(html) {
    const exponent = extractNumber(html, "stat.exp") + extractNumber(html, "skill.exp");
    const modifierDialog = game.burningwheel.modifiers;
    const difficultyDialog = game.burningwheel.gmDifficulty;
    let diff = 0;
    if (game.burningwheel.useGmDifficulty && !extractNumber(html, "forceCustomDifficulty")) {
        diff = difficultyDialog.difficulty;
    }
    else {
        diff = extractNumber(html, "difficulty");
    }
    const addHelp = extractCheckboxValue(html, "acceptHelp") === 1;
    let helpDice = 0;
    const persona = extractSelectNumber(html, "personaDice");
    const deeds = extractCheckboxValue(html, "deedsDice");
    const aDice = extractNumber(html, "arthaDice") + persona + deeds;
    const bDice = extractNumber(html, "bonusDice");
    const woundDice = extractNumber(html, "woundDice") || 0;
    const obPenalty = extractNumber(html, "obPenalty") || 0;
    const cashDice = extractSelectNumber(html, "cashDice") || 0;
    const fundDice = extractSelectNumber(html, "fundDice") || 0;
    const splitPool = extractNumber(html, "splitPool");
    const miscDice = extractMiscDice(html);
    const miscObs = extractMiscObs(html);
    const circlesBonus = extractSourcedValue(html, "circlesBonus");
    const circlesMalus = extractSourcedValue(html, "circlesMalus");
    let penaltySources = obPenalty ? { "Wound Penalty": `+${obPenalty}` } : {};
    const toolkitPenalty = extractCheckboxValue(html, "toolPenalty") ? diff : 0;
    if (toolkitPenalty) {
        penaltySources["No Toolkit"] = `+${toolkitPenalty}`;
    }
    const learningPenalty = extractNumber(html, "learning") ? diff + toolkitPenalty : 0;
    if (learningPenalty) {
        penaltySources["Beginner's Luck"] = `+${learningPenalty}`;
    }
    penaltySources = { ...penaltySources, ...miscObs.entries, ...circlesMalus.entries };
    const obstacleTotal = diff + obPenalty + miscObs.sum + toolkitPenalty + circlesMalus.sum;
    const tax = extractNumber(html, "tax");
    const forks = extractCheckboxValue(html, "forkOptions");
    const wildForks = extractCheckboxValue(html, "wildForks");
    if (addHelp) {
        helpDice = modifierDialog.helpDiceTotal;
    }
    let dieSources = {
        "Exponent": `+${exponent}`
    };
    if (woundDice) {
        dieSources["Wound Penalty"] = `-${woundDice}`;
    }
    if (aDice) {
        dieSources.Artha = `+${aDice}`;
    }
    if (bDice) {
        dieSources.Bonus = `+${bDice}`;
    }
    if (forks) {
        dieSources.FoRKs = `+${forks}`;
    }
    if (wildForks) {
        dieSources["Wild FoRKs"] = `+${wildForks}`;
    }
    if (circlesBonus.sum) {
        dieSources = { ...dieSources, ...circlesBonus.entries };
    }
    if (tax) {
        dieSources.Tax = `-${tax}`;
    }
    if (cashDice) {
        dieSources.Cash = `+${cashDice}`;
    }
    if (fundDice) {
        dieSources.Funds = `+${fundDice}`;
    }
    if (miscDice) {
        dieSources = { ...dieSources, ...miscDice.entries };
    }
    if (splitPool) {
        dieSources["Secondary Pool"] = `-${splitPool}`;
    }
    if (addHelp && helpDice) {
        dieSources["Help"] = `+${helpDice}`;
    }
    const diceTotal = aDice + bDice + miscDice.sum + exponent - woundDice + forks + helpDice - tax + circlesBonus.sum + cashDice + fundDice - splitPool;
    const difficultyDice = bDice + miscDice.sum + exponent + wildForks + forks - woundDice + helpDice - tax + circlesBonus.sum + cashDice + fundDice - splitPool;
    return {
        baseDifficulty: diff,
        diceTotal,
        difficultyDice,
        difficultyTestTotal: obstacleTotal,
        difficultyTotal: obstacleTotal + learningPenalty,
        dieSources,
        obSources: {
            ...penaltySources
        },
        wildForks: wildForks,
        difficultyGroup: helpers.difficultyGroup(difficultyDice, obstacleTotal),
        cashDice,
        fundDice,
        splitPool,
        addHelp,
        persona,
        deeds
    };
}
export async function rollWildFork(numDice, shade = 'B') {
    if (numDice <= 0) {
        return;
    }
    const tgt = shade === 'B' ? 3 : (shade === 'G' ? 2 : 1);
    const die = new AstrologyDie({ diceNumber: numDice, target: tgt });
    const result = die.evaluate();
    if (game.dice3d) {
        game.dice3d.show({
            throws: [{
                    dice: die.results.map(r => {
                        return {
                            result: r.result,
                            resultLabel: r.result,
                            type: "d6",
                            vectors: [],
                            options: {}
                        };
                    })
                }]
        });
    }
    return result;
}
export async function getSplitPoolRoll(numDice, open, shade) {
    if (numDice <= 0)
        return undefined;
    return rollDice(numDice, open, shade);
}
export function getSplitPoolText(roll) {
    if (!roll) {
        return "";
    }
    const parentDiv = document.createElement('div');
    const textDiv = helpers.DivOfText("Secondary Successes");
    const resultDiv = helpers.DivOfText(`${roll.result}`, "secondary-pool");
    const diceDiv = document.createElement('div');
    diceDiv.className = "secondary-dice";
    roll.dice[0].results.forEach(r => {
        const diceResult = helpers.DivOfText(r.result, "roll-die");
        diceResult.dataset.success = r.success ? "true" : "false";
        diceDiv.appendChild(diceResult);
    });
    parentDiv.appendChild(textDiv);
    parentDiv.appendChild(resultDiv);
    parentDiv.appendChild(diceDiv);
    return parentDiv.innerHTML;
}
export function mergeDialogData(target, source) {
    if (!source) {
        return target;
    }
    if (source.optionalDiceModifiers) {
        source.optionalDiceModifiers = source.optionalDiceModifiers.concat(...target.optionalDiceModifiers || []);
    }
    if (source.optionalObModifiers) {
        source.optionalObModifiers = source.optionalObModifiers.concat(...target.optionalObModifiers || []);
    }
    if (source.diceModifiers) {
        source.diceModifiers = source.diceModifiers.concat(...target.diceModifiers || []);
    }
    if (source.obModifiers) {
        source.obModifiers = source.obModifiers.concat(...target.obModifiers || []);
    }
    return Object.assign(target, source);
}
export function mergePartials(target, source) {
    if (!source) {
        return target;
    }
    if (source.optionalDiceModifiers && target.optionalDiceModifiers) {
        source.optionalDiceModifiers = source.optionalDiceModifiers.concat(...target.optionalDiceModifiers);
    }
    if (source.optionalObModifiers && target.optionalDiceModifiers) {
        source.optionalObModifiers = source.optionalObModifiers.concat(...target.optionalObModifiers);
    }
    if (source.diceModifiers && target.diceModifiers) {
        source.diceModifiers = source.diceModifiers.concat(...target.diceModifiers);
    }
    if (source.obModifiers && target.obModifiers) {
        source.obModifiers = source.obModifiers.concat(...target.obModifiers);
    }
    return Object.assign(target, source);
}
export class AstrologyDie extends Die {
    constructor({ diceNumber, target }) {
        super({
            number: diceNumber,
            faces: 6,
            modifiers: [
                "x",
                `cs>${target}`,
                "cf1"
            ],
            options: {}
        });
    }
    explode(_modifier) {
        let checked = 0;
        while (checked < this.results.length) {
            const r = this.results[checked];
            checked++;
            if (!r.active)
                continue;
            if (r.result === 1 || r.result === 6) {
                r.exploded = true;
                this.roll();
            }
        }
    }
    countFailures(_modifier) {
        for (const r of this.results) {
            if (r.result === 1) {
                r.count = -1;
            }
        }
    }
}
/* ============ Constants =============== */
export const templates = {
    armorDialog: "systems/burningwheel/templates/dialogs/armor-dialog.hbs",
    armorMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    rerollChatMessage: "systems/burningwheel/templates/chat/reroll-message.hbs",
    pcRollDialog: "systems/burningwheel/templates/dialogs/roll-dialog.hbs",
    pcRollMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    npcRollDialog: "systems/burningwheel/templates/dialogs/roll-dialog.hbs",
    npcMessage: "systems/burningwheel/templates/chat/roll-message.hbs"
};
