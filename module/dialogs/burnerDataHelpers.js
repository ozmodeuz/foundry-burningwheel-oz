import * as constants from "../constants.js";
export function extractRelationshipData(parent) {
    return {
        hateful: extractNamedChildCheck(parent, 'relHat'),
        closeFamily: extractNamedChildNumber(parent, 'relFam') === -2,
        otherFamily: extractNamedChildNumber(parent, 'relFam') === -1,
        romantic: extractNamedChildCheck(parent, "relRom"),
        forbidden: extractNamedChildCheck(parent, "relFor"),
        power: extractNamedChildNumber(parent, 'relPow')
    };
}
function extractNamedChildString(p, name) {
    return p.children(`*[name='${name}']`).val();
}
function extractNamedChildNumber(p, name) {
    return parseInt(extractNamedChildString(p, name)) || 0;
}
function extractNamedChildCheck(p, name) {
    return p.find(`*[name='${name}']`).prop('checked');
}
function extractNamedString(p, name) {
    return p.find(`*[name='${name}']`).val();
}
function extractNamedNumber(p, name) {
    return parseInt(extractNamedString(p, name)) || 0;
}
function extractNamedCheck(p, name) {
    return p.find(`*[name='${name}']`).prop('checked');
}
function costToString(cost) {
    if (cost === 0) {
        return "B";
    }
    if (cost === 5) {
        return "G";
    }
    return "W";
}
function getStatData(html, name) {
    return {
        exp: extractNamedNumber(html, `${name}Spent`),
        shade: costToString(extractNamedNumber(html, `${name}ShadeSpent`))
    };
}
function getAttrData(html, name) {
    return {
        exp: extractNamedNumber(html, `${name}Stat`),
        shade: extractNamedString(html, `${name}Shade`)
    };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractBaseCharacterData(html) {
    // baseStats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseData = {};
    baseData.will = getStatData(html, "will");
    baseData.perception = getStatData(html, "perception");
    baseData.power = getStatData(html, "power");
    baseData.forte = getStatData(html, "forte");
    baseData.agility = getStatData(html, "agility");
    baseData.speed = getStatData(html, "speed");
    baseData.health = getAttrData(html, "health");
    baseData.steel = getAttrData(html, "steel");
    baseData.resources = getAttrData(html, "resources");
    baseData.circles = getAttrData(html, "circles");
    baseData.age = extractNamedString(html, "ageTotal"),
        baseData.stock = extractNamedString(html, "stock"),
        baseData.lifepathString = html.find("input[name='lifepathName']").map((_, e) => $(e).val()).toArray().filter(s => s.trim()).join(", ");
    baseData.custom1 = {
        name: extractNamedString(html, "custom1Name"),
        ...getStatData(html, "custom1")
    };
    baseData.custom2 = {
        name: extractNamedString(html, "custom2Name"),
        ...getStatData(html, "custom2")
    };
    const settings = {
        roundUpMortalWound: extractNamedCheck(html, "settingTough"),
        armorTrained: extractNamedCheck(html, "settingArmorTrained"),
        roundUpReflexes: extractNamedCheck(html, "settingReflex"),
        ignoreSuperficialWounds: extractNamedCheck(html, "settingNumb"),
        showBurner: false
    };
    baseData.settings = settings;
    return baseData;
}
export function extractSkillData(html, skillsList) {
    const skills = [];
    let skillId = "";
    let skillName = "";
    let skillExp = 0;
    let skillData;
    html.find("div.skills-grid").each((_, e) => {
        skillName = extractNamedChildString($(e), "skillName");
        skillExp = extractNamedChildNumber($(e), "skillExponent");
        if (!skillName || skillExp === 0 || !extractNamedCheck($(e), "skillOpened")) {
            return;
        }
        skillId = extractNamedChildString($(e), "skillId");
        if (skillId) {
            skillData = skillsList.find(s => s.id === skillId)?.data;
            if (skillData) {
                skillData.data.exp = skillExp;
                skillData.data.shade = costToString(extractNamedChildNumber($(e), "skillShade"));
                skills.push({
                    data: skillData.data,
                    name: skillData.name,
                    type: skillData.type,
                    img: skillData.img
                });
            }
        }
        else {
            skills.push({
                data: {
                    name: skillName,
                    exp: skillExp,
                    shade: costToString(extractNamedChildNumber($(e), "skillShade")),
                    root1: extractNamedChildString($(e), "skillRoot1"),
                    root2: extractNamedChildString($(e), "skillRoot2"),
                    skilltype: "special",
                    training: extractNamedChildCheck($(e), "skillTraining"),
                    description: "Unknown skill generated during character burning. Update any incorrect data.",
                },
                type: "skill",
                name: skillName,
                img: constants.defaultImages.skill
            });
        }
    });
    return skills;
}
export function extractTraitData(html, traitList) {
    const traits = [];
    let traitName = "";
    let traitId = "";
    let traitData;
    html.find(".burner-traits-grid").each((_, e) => {
        traitName = extractNamedChildString($(e), "traitName");
        if (!traitName || !extractNamedChildCheck($(e), "traitTaken")) {
            return;
        }
        traitId = extractNamedChildString($(e), "traitId");
        if (traitId) {
            traitData = traitList.find(t => t.id === traitId)?.data;
            traits.push(traitData || {});
        }
        else {
            traits.push({
                data: {
                    traittype: extractNamedChildString($(e), "traitType"),
                    text: "Unknown trait created during character burning. Update data accordingly. If the trait adds a reputation or affiliation, those must be added in manually."
                },
                type: "trait",
                name: traitName,
                img: constants.defaultImages[extractNamedChildString($(e), "traitType")]
            });
        }
    });
    return traits;
}
export function extractPropertyData(html, propertyList) {
    const properties = [];
    let propertyName = "";
    let propertyId = "";
    let propertyData;
    html.find(".burner-property").each((_, e) => {
        propertyName = extractNamedChildString($(e), "propertyName");
        if (!propertyName || !extractNamedChildNumber($(e), "propertyCost")) {
            return;
        }
        propertyId = extractNamedChildString($(e), "propertyId");
        if (propertyId) {
            propertyData = propertyList.find(p => p.id === propertyId)?.data;
            properties.push(propertyData || {});
        }
        else {
            properties.push({
                data: {
                    description: "Unknown property created during character burning. Update data accordingly."
                },
                type: "property",
                name: propertyName,
                img: constants.defaultImages.property
            });
        }
    });
    return properties;
}
export function extractReputationData(html) {
    const reputations = [];
    let repName = "";
    let repDice = 0;
    html.find(".burner-reputations").each((_, e) => {
        repName = extractNamedChildString($(e), "reputationName");
        repDice = extractNamedChildNumber($(e), "reputationDice");
        if (!repName || !extractNamedChildNumber($(e), "reputationCost") || repDice === 0) {
            return;
        }
        if (!extractNamedChildCheck($(e), "reputationType")) {
            reputations.push({
                data: {
                    dice: repDice,
                    description: "Unknown affiliation created during character burning. Update data accordingly."
                },
                type: "affiliation",
                name: repName,
                img: constants.defaultImages.affiliation
            });
        }
        else {
            reputations.push({
                data: {
                    dice: repDice,
                    infamous: false,
                    description: "Unknown reputation created during character burning. Update data accordingly."
                },
                type: "reputation",
                name: repName,
                img: constants.defaultImages.reputation
            });
        }
    });
    return reputations;
}
export function extractRelData(html) {
    const relationships = [];
    let relName = "";
    let relData;
    html.find(".burner-relationship-info").each((_, e) => {
        relName = extractNamedChildString($(e), "relationshipName");
        if (!relName) {
            return;
        }
        relData = extractRelationshipData($(e));
        relationships.push({
            data: {
                forbidden: relData.forbidden,
                description: "Relationship created during character burning. Fill in this description accordingly.",
                immediateFamily: relData.closeFamily,
                otherFamily: relData.otherFamily,
                romantic: relData.romantic,
                hateful: relData.hateful,
                enmity: false,
                influence: relData.power === 5 ? "minor" : (relData.power === 10 ? "significant" : "powerful"),
                building: false,
                buildingProgress: 0
            },
            type: "relationship",
            name: relName,
            img: constants.defaultImages.relationship
        });
    });
    return relationships;
}
export function extractGearData(html, gearList) {
    const gear = [];
    let gearName = "";
    let gearType;
    let gearId = "";
    html.find(".burner-gear").each((_, e) => {
        gearName = extractNamedChildString($(e), "itemName");
        gearId = extractNamedChildString($(e), "gearId");
        gearType = extractNamedChildString($(e), "itemType");
        if (!gearName) {
            return;
        }
        if (gearId) {
            gear.push(gearList.find(g => g.id === gearId)?.data || {});
            return;
        }
        const gearItem = {
            type: gearType,
            name: gearName,
            data: {
                description: `Unknown ${gearType.titleCase()} created as part of character burning. Update with the appropriate data.`
            },
            img: constants.defaultImages[gearType]
        };
        gear.push(gearItem);
    });
    return gear;
}
