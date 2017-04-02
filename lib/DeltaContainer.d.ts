import { PatchObject } from "./compare";
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
    set(newData: T): PatchObject[];
    registerPlaceholder(placeholder: string, matcher: RegExp): void;
    listen(segments: string | Function, operation?: PatchOperation, callback?: Function): Listener;
    removeListener(listener: Listener): void;
    removeAllListeners(): void;
    private checkPatches(patches);
    private checkPatch(patch, listener);
    private reset();
}
