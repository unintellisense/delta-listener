import { PatchObject, Operation } from "./compare";
export interface Listener {
    operation?: Operation;
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
    listen(segments: Function): Listener;
    listen(segments: string, callback: Function): Listener;
    listen(segments: string, callback: Function, operation: Operation): Listener;
    removeListener(listener: Listener): void;
    removeAllListeners(): void;
    private checkPatches(patches);
    private getPathVariables(patch, listener);
    private reset();
    compare(newData: any): any[];
    generate(oldData: any, newData: any, patches: PatchObject[], path: string[]): void;
    checkObserveListeners(oldVal: any, newVal: any, path: string[], patches: PatchObject[]): boolean;
}
