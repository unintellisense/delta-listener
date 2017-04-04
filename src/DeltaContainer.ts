export type PatchOperation = PatchObject["op"];

export interface Listener {
    callback: Function,
    operation: PatchOperation,
    rules: RegExp[]
}

export type StateType = 'boolean' | 'number' | 'string' | 'Array' | 'Object';


export interface StateBooleanNode {
    type: 'boolean'
}

export interface StateStringNode {
    type: 'string'
}

export interface StateNumberNode {
    type: 'number'
}

export interface StateArrayNode {
    type: 'Array'
    indexName: string
    arrayObject: StateObjectNode
}

export interface StateObjectNode {
    type: 'Object'
    properties: { [name: string]: StateNodeTypes }
}

export type StateNodeTypes = StateBooleanNode | StateStringNode | StateNumberNode | StateArrayNode | StateObjectNode

let test: StateObjectNode = {
    type: 'Object',
    properties: {
        players: {
            type: 'Array',
            indexName: 'id',
            arrayObject: {
                type: 'Object',
                properties: {}
            }
        }
    }
}

export interface PatchObject {
    path: string[];
    op: "add" | "remove" | "replace";
    value?: any;
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
        let patches = this.compare(this.data, newData);
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



    compare(tree1: any, tree2: any): PatchObject[] {
        var patches: PatchObject[] = [];
        this.generate(tree1, tree2, patches, []);
        return patches;
    }

    deepClone(obj: any) {
        switch (typeof obj) {
            case "object":
                return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5

            case "undefined":
                return null; //this is how JSON.stringify behaves for array items

            default:
                return obj; //no need to clone primitives
        }
    }

    objectKeys(obj: any) {
        if (Array.isArray(obj)) {
            var keys = new Array(obj.length);

            for (var k = 0; k < keys.length; k++) {
                keys[k] = "" + k;
            }

            return keys;
        }

        if (Object.keys) {
            return Object.keys(obj);
        }

        var keys = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                keys.push(i);
            }
        }
        return keys;
    };

    // Dirty check if obj is different from mirror, generate patches and update mirror
    generate(mirror: any, obj: any, patches: PatchObject[], path: string[]) {
        var newKeys = this.objectKeys(obj);
        var oldKeys = this.objectKeys(mirror);
        var changed = false;
        var deleted = false;

        for (var t = oldKeys.length - 1; t >= 0; t--) {
            var key = oldKeys[t];
            var oldVal = mirror[key];
            if (obj.hasOwnProperty(key) && !(obj[key] === undefined && oldVal !== undefined && Array.isArray(obj) === false)) {
                var newVal = obj[key];
                if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null) {
                    this.generate(oldVal, newVal, patches, path.concat(key));
                }
                else {
                    if (oldVal !== newVal) {
                        changed = true;
                        patches.push({ op: "replace", path: path.concat(key), value: this.deepClone(newVal) });
                    }
                }
            }
            else {
                patches.push({ op: "remove", path: path.concat(key) });
                deleted = true; // property has been deleted
            }
        }

        if (!deleted && newKeys.length == oldKeys.length) {
            return;
        }

        for (var t = 0; t < newKeys.length; t++) {
            var key = newKeys[t];
            if (!mirror.hasOwnProperty(key) && obj[key] !== undefined) {
                patches.push({ op: "add", path: path.concat(key), value: this.deepClone(obj[key]) });
            }
        }
    }

}
