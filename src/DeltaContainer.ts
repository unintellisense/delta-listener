import { compare, PatchObject, Operation } from "./compare";

export interface Listener {
    operation?: Operation
    callback: Function,
    rules: RegExp[]
    rawRules: string[]
}

export interface DataChange extends PatchObject {
    path: any;
}

export class DeltaContainer<T> {
    public data: T;
    private listeners: Listener[] = [];
    private defaultListener: Listener;

    private matcherPlaceholders: { [id: string]: RegExp } = {
        ":id": /^([a-zA-Z0-9\-_]+)$/,
        ":number": /^([0-9]+)$/,
        ":string": /^(\w+)$/,
        ":axis": /^([xyz])$/,
        ":*": /(.*)/,
    }

    constructor(data: T) {
        this.data = data;
        this.reset();
    }

    public set(newData: T): void {
        let patches = this.compare(newData);
        this.checkPatches(patches);
        this.data = newData;
        return;
    }

    public registerPlaceholder(placeholder: string, matcher: RegExp) {
        this.matcherPlaceholders[placeholder] = matcher;
    }
    public listen(segments: Function): Listener
    public listen(segments: string, callback: Function): Listener
    public listen(segments: string, callback: Function, operation: Operation): Listener

    public listen(segments: string | Function, callback?: Function, operation?: Operation): Listener {
        let rules: string[];

        if (typeof (segments) === "function") {
            rules = [];
            callback = segments;

        } else {
            rules = segments.split("/");
        }

        let listener: Listener = {
            callback: callback,
            operation: operation,
            rawRules: rules,
            rules: rules.map(segment => {
                if (typeof (segment) === "string") {
                    // replace placeholder matchers
                    return (segment.indexOf(":") === 0)
                        ? this.matcherPlaceholders[segment] || this.matcherPlaceholders[":*"]
                        : new RegExp(`^${segment}$`);
                } else {
                    return segment;
                }
            })
        };

        if (rules.length === 0) {
            this.defaultListener = listener;

        } else {
            this.listeners.push(listener);
        }

        return listener;
    }

    public removeListener(listener: Listener) {
        for (var i = this.listeners.length - 1; i >= 0; i--) {
            if (this.listeners[i] === listener) {
                this.listeners.splice(i, 1);
            }
        }
    }

    public removeAllListeners() {
        this.reset();
    }

    private checkPatches(patches: PatchObject[]) {
        for (let i = patches.length - 1; i >= 0; i--) {
            let matched = false;

            for (let j = 0, len = this.listeners.length; j < len; j++) {
                let listener = this.listeners[j];
                let pathVariables = this.getPathVariables(patches[i], listener);
                if (pathVariables) {
                    if (!listener.operation || listener.operation === patches[i].operation) {
                        listener.callback({
                            path: pathVariables,
                            operation: patches[i].operation,
                            value: patches[i].value
                        });
                        matched = true;
                    }
                }
            }

            // check for fallback listener
            if (!matched && this.defaultListener) {
                this.defaultListener.callback(patches[i]);
            }

        }
    }

    private getPathVariables(patch: PatchObject, listener: Listener): any {
        // skip if rules count differ from patch
        if (patch.path.length !== listener.rules.length) {
            return false;
        }

        let path: any = {};

        for (var i = 0, len = listener.rules.length; i < len; i++) {
            let matches = patch.path[i].match(listener.rules[i]);

            if (!matches || matches.length === 0 || matches.length > 2) {
                return false;

            } else if (listener.rawRules[i].substr(0, 1) === ":") {
                path[listener.rawRules[i].substr(1)] = matches[1];
            }
        }

        return path;
    }

    private reset() {
        this.listeners = [];
    }

    compare(newData: any): any[] {
        var patches: PatchObject[] = [];
        this.generate(this.data, newData, patches, []);
        return patches;
    }

    // Dirty check if obj is different from mirror, generate patches and update mirror
    generate(oldData: any, newData: any, patches: PatchObject[], path: string[]) {
        var newKeys = objectKeys(newData);
        var oldKeys = objectKeys(oldData);
        var changed = false;
        var deleted = false;

        for (var t = oldKeys.length - 1; t >= 0; t--) {
            var prop = oldKeys[t];
            var oldVal = oldData[prop];
            if (newData.hasOwnProperty(prop)  // property still on new data, and...
                && !(newData[prop] === undefined // new data doesnt have the property defined
                    && oldVal !== undefined // or old value for this property was defined
                    && Array.isArray(newData) === false) // or current NewData isn't a array
            ) {
                var newVal = newData[prop];
                if (typeof oldVal == "object" && // old value was a object, and
                    oldVal != null && // old value wasnt null, and 
                    typeof newVal == "object" && // new value is object, and
                    newVal != null) { // new value isnt null
                    // check replace listeners for object level listener
                    let newPath = path.concat(prop);
                    var match = this.checkObserveListeners(oldVal, newVal, newPath, patches);
                    if (!match) {
                        this.generate(oldVal, newVal, patches, newPath);
                    }
                }
                else {
                    if (oldVal !== newVal) {
                        changed = true;
                        patches.push({ operation: "replace", path: path.concat(prop), value: deepClone(newVal) });
                    }
                }
            }
            else {
                patches.push({ operation: "remove", path: path.concat(prop) });
                deleted = true; // property has been deleted
            }
        }

        if (!deleted && newKeys.length == oldKeys.length) {
            return;
        }

        for (var t = 0; t < newKeys.length; t++) {
            var prop = newKeys[t];
            if (!oldData.hasOwnProperty(prop) && newData[prop] !== undefined) {
                patches.push({ operation: "add", path: path.concat(prop), value: deepClone(newData[prop]) });
            }
        }
    }

    checkObserveListeners(oldVal: any, newVal: any, path: string[], patches: PatchObject[]) {
        let rules;

        listenerLoop:

        for (let i = this.listeners.length - 1; i >= 0; i--) {
            if (this.listeners[i].operation !== '*') continue;
            rules = this.listeners[i].rules;
            if (rules.length !== path.length) { // lengths must match
                continue listenerLoop;
            }
            for (let i = 0; i < rules.length; i++) {
                if (!path[i] // if path isn't this long, or
                    || !path[i].match(rules[i])) { // path doesnt match
                    continue listenerLoop;
                }
            }
            // if we got here then the listener matches. test shallow values
            let newKeys = objectKeys(newVal);
            // first just check if the number of properties changed
            if (objectKeys(oldVal).length !== newKeys.length) {
                patches.push({ operation: "*", path: path, value: deepClone(newVal) });
                return true;
            }
            //let oldKeys = objectKeys(oldVal);
            for (let i = newKeys.length - 1; i >= 0; i--) {
                if (oldVal[newKeys[i]] !== newVal[newKeys[i]]) { // shallow value didn't match
                    patches.push({ operation: "*", path: path, value: deepClone(newVal) });
                    return true;
                }
            }
        }
        return false;
    }
}

function deepClone(obj: any) {
    switch (typeof obj) {
        case "object":
            return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5

        case "undefined":
            return null; //this is how JSON.stringify behaves for array items

        default:
            return obj; //no need to clone primitives
    }
}



function objectKeys(obj: any) {
    if (Array.isArray(obj)) {
        var keys = new Array(obj.length);

        for (var k = 0; k < keys.length; k++) {
            keys[k] = "" + k;
        }

        return keys;
    }

    return Object.keys(obj);
};
