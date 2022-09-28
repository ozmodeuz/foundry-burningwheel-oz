var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as constants from "../constants.js";
import { gmOnly } from "../decorators.js";
export const changesState = (callback) => {
    return function (_target, _propertyKey, descriptor) {
        const functionCall = descriptor.value;
        descriptor.value = async function (...args) {
            await functionCall.apply(this, args);
            this.syncData(this.data.data);
            await this.persistState(this.data.data);
            this.render();
            await callback?.call(this);
        };
    };
};
export class ExtendedTestDialog extends Dialog {
    constructor(d, o) {
        super(d, o);
        this.data.topic = "unknown";
        this.data.settingName = "";
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getData() {
        const data = Object.assign(super.getData(), this.data.data);
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.on('submit', (e) => { e.preventDefault(); });
    }
    propagateChange(e) {
        const newValue = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        const dataPath = e.target.name;
        const data = {};
        data[dataPath] = newValue;
        mergeObject(this.data.data, data);
    }
    updateCollection(e, collection) {
        const index = parseInt(e.target.dataset.index || "0");
        const newValue = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        const dataPath = e.target.name;
        collection[index][dataPath] = newValue;
    }
    activateSocketListeners() {
        game.socket.on(constants.socketName, ({ type, data }) => {
            if (type === `update${this.data.topic}`) {
                mergeObject(this.data.data, data);
                this.persistState(this.data.data);
                if (this.rendered) {
                    this.render(true);
                }
            }
            else if (type === `show${this.data.topic}`) {
                this.render(true);
            }
        });
    }
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        const showAllButton = {
            label: "Show",
            icon: "fas fa-eye",
            class: "force-show-dow",
            onclick: () => {
                game.socket.emit(constants.socketName, { type: `show${this.data.topic}` });
            }
        };
        if (game.user?.isGM) {
            buttons = [showAllButton].concat(buttons);
        }
        return buttons;
    }
    syncData(data) {
        game.socket.emit(constants.socketName, { type: `update${this.data.topic}`, data });
    }
    async persistState(data) {
        game.settings.set(constants.systemName, this.data.settingName, JSON.stringify(data));
    }
}
__decorate([
    changesState()
], ExtendedTestDialog.prototype, "propagateChange", null);
__decorate([
    changesState() // eslint-disable-next-line @typescript-eslint/no-explicit-any
], ExtendedTestDialog.prototype, "updateCollection", null);
__decorate([
    gmOnly
], ExtendedTestDialog.prototype, "persistState", null);
