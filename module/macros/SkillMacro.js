import { getImage, getMacroRollPreset } from "./Macro.js";
import { handleSkillRoll } from "../rolls/rollSkill.js";
import { handleNpcSkillRoll } from "../rolls/npcSkillRoll.js";
import { handleLearningRoll } from "../rolls/rollLearning.js";
export function CreateSkillRollMacro(data) {
    if (!data.actorId) {
        return null;
    }
    const skillData = data.data;
    return {
        name: `Test ${skillData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollSkill("${data.actorId}", "${data.id}");`,
        img: getImage(skillData.img, "skill")
    };
}
export function RollSKillMacro(actorId, skillId) {
    const actor = game.actors?.find(a => a.id === actorId);
    if (!actor) {
        ui.notifications?.notify("Unable to find actor linked to this macro. Were they deleted?", "error");
        return;
    }
    const skill = actor.items.get(skillId);
    if (!skill) {
        ui.notifications?.notify("Unable to find skill linked in this macro. Was it deleted?", "error");
        return;
    }
    const dataPreset = getMacroRollPreset(actor);
    if (actor.data.type === "character") {
        if (skill.data.data.learning) {
            handleLearningRoll({ actor: actor, skill, dataPreset });
        }
        else {
            handleSkillRoll({ actor: actor, skill, dataPreset });
        }
    }
    else {
        handleNpcSkillRoll({ actor: actor, skill, dataPreset });
    }
}
