import { buildRerollData, getRollNameClass, rollDice, templates, extractRollData, mergeDialogData } from "./rolls.js";
export async function handleShrugRollEvent({ target, sheet, dataPreset }) {
    return handlePtgsRoll({ target, sheet, shrugging: true, dataPreset });
}
export async function handleGritRollEvent({ target, sheet, dataPreset }) {
    return handlePtgsRoll({ target, sheet, shrugging: false, dataPreset });
}
async function handlePtgsRoll({ sheet, shrugging, dataPreset }) {
    const actor = sheet.actor;
    const stat = getProperty(actor.data, "data.health");
    const rollModifiers = sheet.actor.getRollModifiers("health");
    const data = mergeDialogData({
        name: shrugging ? "Shrug It Off Health" : "Grit Your Teeth Health",
        difficulty: shrugging ? 2 : 4,
        bonusDice: 0,
        arthaDice: 0,
        stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: true,
        showObstacles: true,
        useCustomDifficulty: true
    }, dataPreset);
    const buttons = {};
    buttons.roll = {
        label: "Roll",
        callback: async (dialogHtml) => ptgsRollCallback(dialogHtml, stat, sheet, shrugging)
    };
    const updateData = {};
    const accessor = shrugging ? "data.ptgs.shrugging" : "data.ptgs.gritting";
    updateData[accessor] = true;
    buttons.doIt = {
        label: "Just do It",
        callback: async (_) => actor.update(updateData)
    };
    if (!shrugging && actor.data.data.persona) {
        // we're gritting our teeth and have persona points. give option
        // to spend persona.
        buttons.withPersona = {
            label: "Spend Persona",
            callback: async (_) => {
                updateData["data.persona"] = actor.data.data.persona - 1;
                updateData["data.health.persona"] = (actor.data.data.health.persona || 0) + 1;
                return actor.update(updateData);
            }
        };
    }
    if (shrugging && actor.data.data.fate) {
        // we're shrugging it off and have fate points. give option
        // to spend fate.
        buttons.withFate = {
            label: "Spend Fate",
            callback: async (_) => {
                updateData["data.fate"] = actor.data.data.fate - 1;
                updateData["data.health.fate"] = (actor.data.data.health.fate || 0) + 1;
                return actor.update(updateData);
            }
        };
    }
    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve => new Dialog({
        title: `${data.name} Test`,
        content: html,
        buttons,
        default: "roll"
    }).render(true));
}
async function ptgsRollCallback(dialogHtml, stat, sheet, shrugging) {
    const { diceTotal, baseDifficulty, difficultyTotal, difficultyGroup, dieSources, obSources, persona, deeds } = extractRollData(dialogHtml);
    const roll = await rollDice(diceTotal, stat.open, stat.shade);
    if (!roll) {
        return;
    }
    const fateReroll = buildRerollData({ actor: sheet.actor, roll, accessor: "data.health" });
    if (fateReroll) {
        fateReroll.ptgsAction = shrugging ? "shrugging" : "gritting";
    }
    const callons = sheet.actor.getCallons("health").map(s => {
        return { label: s, ptgsAction: shrugging ? "shrugging" : "gritting", ...buildRerollData({ actor: sheet.actor, roll, accessor: "data.health" }) };
    });
    const isSuccessful = parseInt(roll.result) >= difficultyTotal;
    const data = {
        name: shrugging ? "Shrug It Off Health" : "Grit Your Teeth Health",
        successes: roll.result,
        difficulty: baseDifficulty,
        nameClass: getRollNameClass(stat.open, stat.shade),
        obstacleTotal: difficultyTotal,
        success: isSuccessful,
        rolls: roll.dice[0].results,
        difficultyGroup,
        dieSources,
        penaltySources: obSources,
        fateReroll,
        callons
    };
    sheet.actor.updateArthaForStat("data.health", persona, deeds);
    if (isSuccessful) {
        const accessor = shrugging ? "data.ptgs.shrugging" : "data.ptgs.gritting";
        const updateData = {};
        updateData[accessor] = true;
        sheet.actor.update(updateData);
    }
    if (sheet.actor.data.type === "character") {
        sheet.actor.addAttributeTest(stat, "Health", "data.health", difficultyGroup, isSuccessful);
    }
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor: sheet.actor })
    });
}
