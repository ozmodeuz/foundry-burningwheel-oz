export const gmOnly = (_target, _propertyKey, descriptor) => {
    const functionCall = descriptor.value;
    descriptor.value = function (...args) {
        if (!game.user?.isGM) {
            return;
        }
        return functionCall.apply(this, args);
    };
};
