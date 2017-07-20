export interface Listener {
    callback: Function;
    rules: RegExp[];
    rawRules: string[];
}
export interface DataChange extends PatchObject {
    path: any;
}
export declare class DeltaContainer<T> {
    data: T;
    private listeners;
    private defaultListener;
    private matcherPlaceholders;
    constructor(data: T);
    set(newData: T): void;
    registerPlaceholder(placeholder: string, matcher: RegExp): void;
    listen(segments: string | Function, callback?: Function): Listener;
    removeListener(listener: Listener): void;
    removeAllListeners(): void;
    private checkPatches(patches);
    private getPathVariables(patch, listener);
    private reset();
    compare(newData: any): any[];
    generate(oldData: any, newData: any, patches: PatchObject[], path: string[]): void;
    checkObjectReplaceListeners(oldVal: any, newVal: any, path: string[], patches: PatchObject[]): boolean;
}
export interface PatchObject {
    path: string[];
    op: "add" | "remove" | "replace";
    value?: any;
}
