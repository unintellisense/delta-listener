export declare type PatchOperation = PatchObject["op"];
export interface Listener {
    callback: Function;
    operation: PatchOperation;
    rules: RegExp[];
}
export declare class DeltaContainer<T> {
    data: T;
    private listeners;
    private matcherPlaceholders;
    constructor(data: T);
    set(newData: T): void;
    registerPlaceholder(placeholder: string, matcher: RegExp): void;
    listen(segments: string | Function, operation?: PatchOperation, callback?: Function): Listener;
    removeListener(listener: Listener): void;
    removeAllListeners(): void;
    protected checkPatches(patches: PatchObject[]): void;
    private checkPatch(patch, listener);
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
