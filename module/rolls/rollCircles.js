import * as helpers from "../helpers.js";
import { buildRerollData, getRollNameClass, rollDice, templates, extractRollData, mergeDialogData } from "./rolls.js";
import { buildHelpDialog } from "../dialogs/buildHelpDialog.js";
export async function handleCirclesRollEvent({ target, sheet, dataPreset }) {
    const stat = getProperty(sheet.actor.data, "data.circles");
    let circlesContact;
    if (target.dataset.relationshipId) {
        circlesContact = sheet.actor.items.get(target.dataset.relationshipId);
    }
    const actor = sheet.actor;
    return handleCirclesRoll({ actor, dataPreset, circlesContact, stat });
}
export async function handleCirclesRoll({ actor, stat, dataPreset, circlesContact }) {
    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: "data.circles",
            actor,
            helpedWith: "Circles"
        });
    }
    const rollModifiers = actor.getRollModifiers("circles");
    const data = mergeDialogData({
        name: "Circles Test",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        circlesBonus: actor.data.circlesBonus,
        circlesMalus: actor.data.circlesMalus,
        circlesContact,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
    }, dataPreset);
    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve => new Dialog({
        title: `Circles Test`,
        content: html,
        buttons: {
            roll: {
                label: "Roll",
                callback: async (dialogHtml) => circlesRollCallback(dialogHtml, stat, actor, circlesContact)
            }
        },
        default: "roll"
    }).render(true));
}
async function circlesRollCallback(dialogHtml, stat, actor, contact) {
    const rollData = extractRollData(dialogHtml);
    if (contact) {
        rollData.dieSources["Named Contact"] = "+1";
        rollData.diceTotal++;
        rollData.difficultyDice++;
        rollData.difficultyGroup = helpers.difficultyGroup(rollData.difficultyDice, rollData.difficultyTestTotal);
    }
    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) {
        return;
    }
    const fateReroll = buildRerollData({ actor, roll, accessor: "data.circles" });
    const callons = actor.getCallons("circles").map(s => {
        return { label: s, ...buildRerollData({ actor, roll, accessor: "data.circles" }) };
    });
    await actor.addAttributeTest(stat, "Circles", "data.circles", rollData.difficultyGroup, true);
    if (rollData.addHelp) {
        game.burningwheel.modifiers.grantTests(rollData.difficultyTestTotal, parseInt(roll.result) >= rollData.difficultyTotal);
    }
    actor.updateArthaForStat("data.circles", rollData.persona, rollData.deeds);
    const data = {
        name: `Circles`,
        successes: roll.result,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: parseInt(roll.result) >= rollData.difficultyTotal,
        rolls: roll.dice[0].results,
        difficultyGroup: rollData.difficultyGroup,
        dieSources: rollData.dieSources,
        penaltySources: rollData.obSources,
        fateReroll,
        callons
    };
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    // increment relationship tracking values...
    if (contact && contact.data.data.building) {
        const progress = (contact.data.data.buildingProgress || 0) + 1;
        contact.update({ "data.buildingProgress": progress });
        if (progress >= 10 - (contact.data.data.aptitude || 10)) {
            Dialog.confirm({
                title: "Relationship Building Complete",
                content: `<p>Relationship with ${contact.name} has been built enough to advance. Do so?</p>`,
                yes: () => { contact.update({ "data.building": false }); },
                no: () => { return; }
            });
        }
    }
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor })
    });
}
