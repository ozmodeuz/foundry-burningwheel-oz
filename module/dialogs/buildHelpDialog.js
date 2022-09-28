export async function buildHelpDialog({ exponent, path, skillId, actor, helpedWith }) {
    const data = {
        exponent
    };
    const content = await renderTemplate("systems/burningwheel/templates/dialogs/help-dialog.hbs", data);
    return new Dialog({
        title: "Add Helping Dice",
        content: content,
        buttons: {
            help: {
                label: "Help",
                callback: () => {
                    registerHelpEntry({ path, skillId, actor, exponent, helpedWith });
                }
            }
        },
        default: "help"
    }).render(true);
}
async function registerHelpEntry({ path, skillId, actor, exponent, helpedWith }) {
    const modifiers = game.burningwheel.modifiers;
    modifiers.addHelp({
        dice: exponent,
        skillId,
        path,
        actor,
        title: actor.name,
        helpedWith
    });
}
