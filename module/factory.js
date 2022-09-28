import { BWCharacter } from "./actors/BWCharacter.js";
import { Armor } from "./items/armor.js";
import { Belief } from "./items/belief.js";
import { Instinct } from "./items/instinct.js";
import { MeleeWeapon } from "./items/meleeWeapon.js";
import { Possession } from "./items/possession.js";
import { Property } from "./items/property.js";
import { RangedWeapon } from "./items/rangedWeapon.js";
import { Relationship } from "./items/relationship.js";
import { Reputation } from "./items/reputation.js";
import { Skill } from "./items/skill.js";
import { Spell } from "./items/spell.js";
import { Trait } from "./items/trait.js";
import { Npc } from "./actors/Npc.js";
import { Lifepath } from "./items/lifepath.js";
import { BWSetting } from "./actors/BWSetting.js";
import { Affiliation } from "./items/affiliation.js";
function factory(entities, baseClass) {
    return new Proxy(baseClass, {
        construct: (target, args) => {
            const [data, options] = args;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const constructor = entities[data.type];
            if (!constructor) {
                throw new Error("Unsupported Document type for create(): " + data.type);
            }
            return new constructor(data, options);
        },
        get: (target, prop) => {
            switch (prop) {
                case "create":
                    //Calling the class' create() static function
                    return function (data, options) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const constructor = entities[data.type];
                        if (!constructor) {
                            throw new Error("Unsupported Entity type for create(): " + data.type);
                        }
                        return constructor.create(data, options);
                    };
                case Symbol.hasInstance:
                    //Applying the "instanceof" operator on the instance object
                    return function (instance) {
                        const constr = entities[instance.data.type];
                        if (!constr) {
                            return false;
                        }
                        return instance instanceof constr;
                    };
                default:
                    //Just forward any requested properties to the base Actor class
                    return baseClass[prop];
            }
        }
    });
}
const actorTypes = {};
actorTypes["character"] = BWCharacter;
actorTypes["npc"] = Npc;
actorTypes["setting"] = BWSetting;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actorConstructor = factory(actorTypes, Actor);
const itemTypes = {};
itemTypes["belief"] = Belief;
itemTypes["instinct"] = Instinct;
itemTypes["trait"] = Trait;
itemTypes["skill"] = Skill;
itemTypes["armor"] = Armor;
itemTypes["possession"] = Possession;
itemTypes["property"] = Property;
itemTypes["relationship"] = Relationship;
itemTypes["melee weapon"] = MeleeWeapon;
itemTypes["ranged weapon"] = RangedWeapon;
itemTypes["reputation"] = Reputation;
itemTypes["affiliation"] = Affiliation;
itemTypes["spell"] = Spell;
itemTypes["lifepath"] = Lifepath;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const itemConstructor = factory(itemTypes, Item);
