

export type PatchOperation = PatchObject["op"];

export interface Listener {
    callback: Function,
    operation: PatchOperation,
    rules: RegExp[]
}

export class DeltaContainer<T> {
    public data: T;
    private listeners: { [op: string]: Listener[] };

    private matcherPlaceholders: { [id: string]: RegExp } = {
        ":id": /^([a-zA-Z0-9\-_]+)$/,
        ":number": /^([0-9]+)$/,
        ":string": /^(\w+)$/,
        ":axis": /^([xyz])$/,
        "*": /(.*)/,
    }

    constructor(data: T) {
        this.data = data;
        this.reset();
    }

    public set(newData: T): PatchObject[] {
        let patches = this.compare(newData);
        this.checkPatches(patches);
        this.data = newData;
        return patches;
    }

    public registerPlaceholder(placeholder: string, matcher: RegExp) {
        this.matcherPlaceholders[placeholder] = matcher;
    }

    public listen(segments: string | Function, operation?: PatchOperation, callback?: Function): Listener {
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
            rules: rules.map(segment => {
                if (typeof (segment) === "string") {
                    // replace placeholder matchers
                    return (segment.indexOf(":") === 0)
                        ? this.matcherPlaceholders[segment] || this.matcherPlaceholders["*"]
                        : new RegExp(segment);
                } else {
                    return segment;
                }
            })
        };

        this.listeners[operation || ""].push(listener);

        return listener;
    }

    public removeListener(listener: Listener) {
        for (var i = this.listeners[listener.operation].length - 1; i >= 0; i--) {
            if (this.listeners[listener.operation][i] === listener) {
                this.listeners[listener.operation].splice(i, 1);
            }
        }
    }

    public removeAllListeners() {
        this.reset();
    }

    private checkPatches(patches: PatchObject[]) {

        for (let i = patches.length - 1; i >= 0; i--) {
            let matched = false;
            let op = patches[i].op;
            for (let j = 0, len = this.listeners[op].length; j < len; j++) {
                let listener = this.listeners[op][j];
                let matches = this.checkPatch(patches[i], listener);
                if (matches) {
                    listener.callback(...matches, patches[i].value);
                    matched = true;
                }
            }

            // check for fallback listener
            if (!matched && this.listeners[""]) {
                for (var j = 0, len = this.listeners[""].length; j < len; j++) {
                    this.listeners[""][j].callback(patches[i].path, patches[i].op, patches[i].value);
                }
            }

        }

    }

    private checkPatch(patch: PatchObject, listener: Listener): any {
        // skip if rules count differ from patch
        if (patch.path.length !== listener.rules.length) {
            return false;
        }

        let pathVars: any[] = [];

        for (var i = 0, len = listener.rules.length; i < len; i++) {
            let matches = patch.path[i].match(listener.rules[i]);

            if (!matches || matches.length === 0 || matches.length > 2) {
                return false;

            } else {
                pathVars = pathVars.concat(matches.slice(1));
            }
        }

        return pathVars;
    }

    private reset() {
        this.listeners = {
            "": [], // fallback
            "add": [],
            "remove": [],
            "replace": []
        };
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
                    this.checkObjectReplaceListeners(oldVal, newVal, newPath, patches);
                    this.generate(oldVal, newVal, patches, newPath);
                }
                else {
                    if (oldVal !== newVal) {
                        changed = true;
                        patches.push({ op: "replace", path: path.concat(prop), value: deepClone(newVal) });
                    }
                }
            }
            else {
                patches.push({ op: "remove", path: path.concat(prop) });
                deleted = true; // property has been deleted
            }
        }

        if (!deleted && newKeys.length == oldKeys.length) {
            return;
        }

        for (var t = 0; t < newKeys.length; t++) {
            var prop = newKeys[t];
            if (!oldData.hasOwnProperty(prop) && newData[prop] !== undefined) {
                patches.push({ op: "add", path: path.concat(prop), value: deepClone(newData[prop]) });
            }
        }
    }

    checkObjectReplaceListeners(oldVal: any, newVal: any, path: string[], patches: PatchObject[]) {
        let rules;

        listenerLoop:

        for (let i = this.listeners.replace.length - 1; i >= 0; i--) {
            rules = this.listeners.replace[i].rules;
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
                patches.push({ op: "replace", path: path, value: deepClone(newVal) });
                break listenerLoop;
            }
            //let oldKeys = objectKeys(oldVal);
            for (let i = newKeys.length - 1; i >= 0; i--) {
                if (oldVal[newKeys[i]] !== newVal[newKeys[i]]) { // shallow value didn't match
                    patches.push({ op: "replace", path: path, value: deepClone(newVal) });
                    break listenerLoop;
                }
            }

            break listenerLoop;
        }
    }
}

export interface PatchObject {
    path: string[];
    op: "add" | "remove" | "replace";
    value?: any;
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
