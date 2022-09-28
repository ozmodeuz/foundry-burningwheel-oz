export function updateTestsNeeded(ability, needRoutines = true, woundDice = 0, tax = 0) {
    const values = AbilityLookup[ability.exp] || { r: 1, d: 1, c: 1 };
    ability.routineNeeded = values.r;
    ability.challengingNeeded = values.c;
    ability.difficultNeeded = values.d;
    ability.cssClass = canAdvance(ability, needRoutines) ? "can-advance" : "";
    if (ability.exp <= woundDice + tax) {
        ability.cssClass += " wound-disabled";
    }
}
export function slugify(name) {
    return name.trim().replace(" ", "-");
}
export function toDictionary(list) {
    const o = {};
    list.forEach(s => o[s] = s.titleCase());
    return o;
}
export function canAdvance(skill, needRoutines = true) {
    const enoughRoutine = (skill.routine >= (skill.routineNeeded || 0));
    const enoughDifficult = skill.difficult >= (skill.difficultNeeded || 0);
    const enoughChallenging = skill.challenging >= (skill.challengingNeeded || 0);
    if (skill.exp === 0) {
        return enoughRoutine || enoughDifficult || enoughChallenging;
    }
    if (skill.exp < 5 && needRoutines) {
        // need only enough difficult or routine, not both
        return enoughRoutine && (enoughDifficult || enoughChallenging);
    }
    // otherwise, need both routine and difficult tests to advance, don't need routine anymore
    return enoughDifficult && enoughChallenging;
}
export function difficultyGroup(dice, difficulty) {
    if (difficulty > dice) {
        return "Challenging";
    }
    if (dice === 1) {
        return "Routine/Difficult";
    }
    if (dice === 2) {
        return difficulty === 2 ? "Difficult" : "Routine";
    }
    let spread = 1;
    if (dice > 6) {
        spread = 3;
    }
    else if (dice > 3) {
        spread = 2;
    }
    return (dice - spread >= difficulty) ? "Routine" : "Difficult";
}
export function getWorstShadeString(a, b) {
    if (a === b) {
        return a;
    }
    else if (a === "B" || b === "B") {
        return "B";
    }
    return "G";
}
export function getArmorLocationDataFromItem(i) {
    if (!i.data.equipped) {
        return {};
    }
    const data = {};
    if (i.data.hasHelm) {
        data.head = i;
    }
    if (i.data.hasTorso) {
        data.torso = i;
    }
    if (i.data.hasLeftArm) {
        data.leftArm = i;
    }
    if (i.data.hasRightArm) {
        data.rightArm = i;
    }
    if (i.data.hasRightLeg) {
        data.rightLeg = i;
    }
    if (i.data.hasLeftLeg) {
        data.leftLeg = i;
    }
    if (i.data.hasShield) {
        data.shield = i;
    }
    return data;
}
export async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
export function isStat(name) {
    return ([
        "forte", "power", "will", "perception", "agility", "speed"
    ].indexOf(name.toLowerCase()) !== -1);
}
export async function getItemsOfTypes(itemTypes, compendiums) {
    let itemList = [];
    const useAll = !compendiums;
    const useWorld = compendiums?.indexOf('world') !== -1;
    if (useWorld) {
        itemList = game.items?.filter((i) => itemTypes.indexOf(i.type) !== -1)
            .map((item) => {
            item.itemSource = "World";
            return item;
        });
    }
    let compendiumItems = [];
    let sourceLabel = "";
    const packs = Array.from(game.packs?.contents || []).filter(p => useAll || compendiums?.indexOf(p.collection) !== -1);
    for (const pack of packs) {
        const packItems = await pack.getDocuments();
        sourceLabel = compendiumName(pack);
        compendiumItems = compendiumItems.concat(...packItems.filter((item) => itemTypes.indexOf(item.type) !== -1)
            .map((item) => {
            item.itemSource = sourceLabel;
            return item;
        }));
    }
    return itemList.concat(...compendiumItems);
}
export function compendiumName(c) {
    return c.metadata.label;
}
export async function getItemsOfType(itemType, compendiums) {
    return getItemsOfTypes([itemType], compendiums);
}
export function getCompendiumList() {
    const packs = Array.from(game.packs?.contents || []);
    return [{ name: "world", label: "World Content" }].concat(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...packs.filter((p) => game.user?.isGM || !p.private)
        .map(p => {
        return {
            name: p.collection,
            label: compendiumName(p)
        };
    })
        .sort((a, b) => a.label.localeCompare(b.label)));
}
export async function notifyError(title, errorMessage) {
    return new Dialog({
        title,
        content: `<p>${errorMessage}</p>`,
        buttons: {
            ok: {
                label: "OK"
            }
        },
        default: "ok"
    }).render(true);
}
export function deCamelCaseify(phrase) {
    return phrase.replace(/([a-zA-Z])(?=[A-Z])/, '$1 ');
}
export function DivOfText(text, cssClass) {
    const element = document.createElement("div");
    element.innerHTML = text.toString();
    if (cssClass) {
        element.className = cssClass;
    }
    return element;
}
export function translateWoundValue(shade, value) {
    value = parseInt(value.toString());
    if (value < 17) {
        return shade + value;
    }
    if (shade === "B") {
        value -= 16;
        shade = "G";
        if (value < 17) {
            return shade + value;
        }
    }
    if (shade === "G") {
        value -= 16;
        shade = "W";
    }
    return shade + value;
}
const AbilityLookup = {
    "1": { r: 1, d: 1, c: 1 },
    "2": { r: 2, d: 1, c: 1 },
    "3": { r: 3, d: 2, c: 1 },
    "4": { r: 4, d: 2, c: 1 },
    "5": { r: 0, d: 3, c: 1 },
    "6": { r: 0, d: 3, c: 2 },
    "7": { r: 0, d: 4, c: 2 },
    "8": { r: 0, d: 4, c: 3 },
    "9": { r: 0, d: 5, c: 3 },
};
/** For Sorting Items/Actors/Etc. by Name */
export const byName = (a, b) => a.name.localeCompare(b.name);
/** For removing quotes and apostrophes from strings */
export const escapeQuotes = (a) => a.replace(/\\([\s\S])|(['"])/g, "\\$1$2");
