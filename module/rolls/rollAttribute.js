import { buildRerollData, getRollNameClass, rollDice, templates, extractRollData, mergeDialogData } from "./rolls.js";
import { buildHelpDialog } from "../dialogs/buildHelpDialog.js";
export async function handleAttrRollEvent({ target, sheet, dataPreset }) {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor || "");
    const actor = sheet.actor;
    const attrName = target.dataset.rollableName || "Unknown Attribute";
    return handleAttrRoll({ actor, stat, attrName, dataPreset, accessor: target.dataset.accessor || "" });
}
export async function handleAttrRoll({ actor, stat, attrName, accessor, dataPreset }) {
    const rollModifiers = actor.getRollModifiers(attrName);
    dataPreset = dataPreset || {};
    const woundDice = attrName === "Steel" ? actor.data.data.ptgs.woundDice : undefined;
    const obPenalty = attrName === "Steel" ? actor.data.data.ptgs.obPenalty : undefined;
    if (attrName.toLowerCase() === "steel") {
        dataPreset.useCustomDifficulty = true;
        dataPreset.showDifficulty = true;
        dataPreset.showObstacles = true;
        dataPreset.difficulty = actor.data.data.hesitation || 0;
    }
    const data = mergeDialogData({
        name: `${attrName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice,
        obPenalty,
        stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: (!game.burningwheel.useGmDifficulty) || !!obPenalty
    }, dataPreset);
    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: accessor,
            actor,
            helpedWith: attrName
        });
    }
    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve => new Dialog({
        title: `${attrName} Test`,
        content: html,
        buttons: {
            roll: {
                label: "Roll",
                callback: async (dialogHtml) => attrRollCallback(dialogHtml, stat, actor, attrName, accessor)
            }
        },
        default: "roll"
    }).render(true));
}
async function attrRollCallback(dialogHtml, stat, actor, name, accessor) {
    const rollData = extractRollData(dialogHtml);
    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) {
        return;
    }
    const isSuccessful = parseInt(roll.result) >= (rollData.difficultyTotal);
    const fateReroll = buildRerollData({ actor, roll, accessor });
    const callons = actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, accessor }) };
    });
    await actor.addAttributeTest(stat, name, accessor, rollData.difficultyGroup, isSuccessful);
    if (rollData.addHelp) {
        game.burningwheel.modifiers.grantTests(rollData.difficultyTestTotal, isSuccessful);
    }
    actor.updateArthaForStat(accessor, rollData.persona, rollData.deeds);
    const data = {
        name: `${name}`,
        successes: roll.result,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].results,
        difficultyGroup: rollData.difficultyGroup,
        penaltySources: rollData.obSources,
        dieSources: { ...rollData.dieSources },
        fateReroll,
        callons
    };
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor })
    });
}
