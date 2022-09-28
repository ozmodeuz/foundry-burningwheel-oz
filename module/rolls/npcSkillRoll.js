import { buildRerollData, getRollNameClass, rollDice, templates, extractRollData, rollWildFork, mergeDialogData, getSplitPoolText, getSplitPoolRoll } from "./rolls.js";
import { byName, notifyError } from "../helpers.js";
import { handleNpcStatRoll } from "./npcStatRoll.js";
import { buildHelpDialog } from "../dialogs/buildHelpDialog.js";
export async function handleNpcWeaponRollEvent({ target, sheet, dataPreset }) {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.weaponId || "";
    if (!skillId) {
        return notifyError("No Weapon Skill", "No Weapon Skill Chosen. Set the sheet into edit mode and pick a Martial skill to use with this weapon.");
    }
    const skill = sheet.actor.items.get(skillId);
    const weapon = sheet.actor.items.get(itemId);
    const attackIndex = parseInt(target.dataset.attackIndex);
    return handleNpcWeaponRoll({
        actor: sheet.actor,
        weapon,
        skill,
        attackIndex,
        dataPreset
    });
}
export async function handleNpcWeaponRoll({ actor, weapon, skill, attackIndex, dataPreset }) {
    if (!weapon) {
        return notifyError("Missing Weapon", "The weapon that is being cast appears to be missing from the character sheet.");
    }
    const extraInfo = weapon.type === "melee weapon" ?
        await weapon.getWeaponMessageData(attackIndex || 0) :
        await weapon.getWeaponMessageData();
    return handleNpcSkillRoll({ actor, skill, extraInfo, dataPreset });
}
export async function handleNpcSpellRollEvent({ target, sheet, dataPreset }) {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.spellId || "";
    if (!skillId) {
        return notifyError("No Sorcerous Skill", "No Casting Skill Chosen. Set the sheet into edit mode and pick a Sorcerous skill to use with this weapon.");
    }
    const skill = sheet.actor.items.get(skillId);
    const spell = sheet.actor.items.get(itemId);
    return handleNpcSpellRoll({ actor: sheet.actor, spell, skill, dataPreset });
}
export async function handleNpcSpellRoll({ actor, spell, skill, dataPreset }) {
    if (!spell) {
        return notifyError("Missing Spell", "The spell that is being cast appears to be missing from the character sheet.");
    }
    const obstacle = spell.data.data.variableObstacle ? 3 : spell.data.data.obstacle;
    if (dataPreset) {
        dataPreset.difficulty = obstacle;
    }
    else {
        dataPreset = { difficulty: obstacle };
    }
    dataPreset.useCustomDifficulty = dataPreset.showObstacles = dataPreset.showDifficulty = true;
    const extraInfo = await spell.getSpellMessageData();
    return handleNpcSkillRoll({ actor, skill, extraInfo, dataPreset });
}
export async function handleNpcSkillRollEvent({ target, sheet, extraInfo, dataPreset }) {
    const actor = sheet.actor;
    const skill = actor.items.get(target.dataset.skillId || "");
    return handleNpcSkillRoll({ actor, skill, extraInfo, dataPreset });
}
export async function handleNpcSkillRoll({ actor, skill, extraInfo, dataPreset }) {
    dataPreset = dataPreset || {};
    dataPreset.deedsPoint = actor.data.data.deeds !== 0;
    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: skill.data.data.exp,
            skillId: skill.id,
            actor,
            helpedWith: skill.name
        });
    }
    if (actor.data.data.persona) {
        dataPreset.personaOptions = Array.from(Array(Math.min(actor.data.data.persona, 3)).keys());
    }
    if (skill.data.data.learning) {
        const accessor = `data.${skill.data.data.root1}`;
        if (dataPreset) {
            dataPreset.learning = true;
        }
        else {
            dataPreset = { learning: true };
        }
        const stat = getProperty(actor.data, accessor);
        const rollData = {
            dice: stat.exp,
            shade: stat.shade,
            open: stat.open,
            statName: skill.data.data.root1,
            actor,
            extraInfo,
            dataPreset
        };
        if (skill.data.data.root2) {
            // learning skill that requires a stat choice for rolling
            return new Dialog({
                title: "Pick which base stat to use",
                content: "<p>The listed skill uses one of two possible roots. Pick one to roll.</p>",
                buttons: {
                    root1: {
                        label: skill.data.data.root1.titleCase(),
                        callback: () => handleNpcStatRoll(rollData)
                    },
                    root2: {
                        label: skill.data.data.root2.titleCase(),
                        callback: () => {
                            const stat2 = getProperty(actor.data, `data.${skill.data.data.root2}`);
                            rollData.dice = stat2.exp;
                            rollData.shade = stat2.shade;
                            rollData.open = stat2.open;
                            rollData.statName = skill.data.data.root2;
                            return handleNpcStatRoll(rollData);
                        }
                    }
                },
                default: "root1"
            }).render(true);
        }
        return handleNpcStatRoll(rollData);
    }
    const rollModifiers = actor.getRollModifiers(skill.name);
    const data = mergeDialogData({
        name: `${skill.name} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: skill.data.data,
        needsToolkit: skill.data.data.tools,
        toolkits: actor.data.toolkits,
        forkOptions: actor.getForkOptions(skill.data.name).sort(byName),
        wildForks: actor.getWildForks(skill.data.name).sort(byName),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
            || !!actor.data.data.ptgs.obPenalty
            || ((dataPreset && dataPreset.obModifiers && !!dataPreset.obModifiers.length) || false)
    }, dataPreset);
    const html = await renderTemplate(templates.npcRollDialog, data);
    return new Promise(_resolve => new Dialog({
        title: `${skill.name} Test`,
        content: html,
        buttons: {
            roll: {
                label: "Roll",
                callback: async (dialogHtml) => skillRollCallback(dialogHtml, actor, skill, extraInfo)
            }
        },
        default: "roll"
    }).render(true));
}
async function skillRollCallback(dialogHtml, actor, skill, extraInfo) {
    const rollData = extractRollData(dialogHtml);
    const dg = rollData.difficultyGroup;
    const roll = await rollDice(rollData.diceTotal, skill.data.data.open, skill.data.data.shade);
    if (!roll) {
        return;
    }
    const wildForkDie = await rollWildFork(rollData.wildForks, skill.data.data.shade);
    const wildForkBonus = wildForkDie?.total || 0;
    const wildForkDice = wildForkDie?.results || [];
    const isSuccessful = parseInt(roll.result) + wildForkBonus >= rollData.difficultyTotal;
    let splitPoolString;
    let splitPoolRoll;
    if (rollData.splitPool) {
        splitPoolRoll = await getSplitPoolRoll(rollData.splitPool, skill.data.data.open, skill.data.data.shade);
        splitPoolString = getSplitPoolText(splitPoolRoll);
    }
    extraInfo = `${splitPoolString || ""} ${extraInfo || ""}`;
    const fateReroll = buildRerollData({ actor, roll, itemId: skill.id, splitPoolRoll });
    const callons = actor.getCallons(skill.name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, splitPoolRoll, itemId: skill.id }) };
    });
    // because artha isn't tracked individually, it doesn't matter what gets updated.
    // both cases here end up just subtracting the artha spent.
    actor.updateArthaForStat("", rollData.persona, rollData.deeds);
    if (rollData.addHelp) {
        game.burningwheel.modifiers.grantTests(rollData.difficultyTestTotal, isSuccessful);
    }
    const data = {
        name: `${skill.name}`,
        successes: '' + (parseInt(roll.result) + wildForkBonus),
        splitSuccesses: splitPoolRoll ? splitPoolRoll.result : undefined,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(skill.data.data.open, skill.data.data.shade),
        success: isSuccessful,
        rolls: roll.dice[0].results,
        wildRolls: wildForkDice,
        difficultyGroup: dg,
        penaltySources: rollData.obSources,
        dieSources: rollData.dieSources,
        fateReroll,
        callons,
        extraInfo
    };
    const messageHtml = await renderTemplate(templates.npcMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor })
    });
}
