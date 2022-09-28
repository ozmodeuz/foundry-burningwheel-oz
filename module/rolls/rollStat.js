import { buildRerollData, getRollNameClass, rollDice, templates, extractRollData, mergeDialogData, getSplitPoolText, getSplitPoolRoll } from "./rolls.js";
import { buildHelpDialog } from "../dialogs/buildHelpDialog.js";
export async function handleStatRollEvent(options) {
    const accessor = options.target.dataset.accessor || "";
    const stat = getProperty(options.sheet.actor.data, accessor);
    const actor = options.sheet.actor;
    const statName = options.target.dataset.rollableName || "Unknown Stat";
    return handleStatRoll({ actor, statName, stat, accessor, ...options });
}
export async function handleStatRoll({ actor, statName, stat, accessor, dataPreset }) {
    const rollModifiers = actor.getRollModifiers(statName);
    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: accessor,
            actor,
            helpedWith: statName
        });
    }
    let tax = 0;
    if (statName.toLowerCase() === "will") {
        tax = actor.data.data.willTax;
    }
    else if (statName.toLowerCase() === "forte") {
        tax = actor.data.data.forteTax;
    }
    const data = mergeDialogData({
        name: `${statName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        tax,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty || !!actor.data.data.ptgs.obPenalty
    }, dataPreset);
    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve => new Dialog({
        title: `${statName} Test`,
        content: html,
        buttons: {
            roll: {
                label: "Roll",
                callback: async (dialogHtml) => statRollCallback(dialogHtml, stat, actor, statName, accessor)
            }
        },
        default: "roll"
    }).render(true));
}
async function statRollCallback(dialogHtml, stat, actor, name, accessor) {
    const { diceTotal, difficultyGroup, baseDifficulty, difficultyTotal, obSources, dieSources, splitPool, persona, deeds, addHelp, difficultyTestTotal } = extractRollData(dialogHtml);
    const roll = await rollDice(diceTotal, stat.open, stat.shade);
    if (!roll) {
        return;
    }
    const isSuccessful = parseInt(roll.result) >= difficultyTotal;
    let extraInfo;
    let splitPoolRoll;
    if (splitPool) {
        splitPoolRoll = await getSplitPoolRoll(splitPool, stat.open, stat.shade);
        extraInfo = getSplitPoolText(splitPoolRoll);
    }
    const fateReroll = buildRerollData({ actor, roll, accessor, splitPoolRoll });
    const callons = actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, accessor, splitPoolRoll }) };
    });
    await actor.addStatTest(stat, name, accessor, difficultyGroup, isSuccessful);
    if (addHelp) {
        game.burningwheel.modifiers.grantTests(difficultyTestTotal, isSuccessful);
    }
    actor.updateArthaForStat(accessor, persona, deeds);
    const data = {
        name: `${name}`,
        successes: roll.result,
        splitSuccesses: splitPoolRoll ? splitPoolRoll.result : undefined,
        difficulty: baseDifficulty,
        obstacleTotal: difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].results,
        difficultyGroup,
        penaltySources: obSources,
        dieSources,
        fateReroll,
        callons,
        extraInfo
    };
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor })
    });
}
