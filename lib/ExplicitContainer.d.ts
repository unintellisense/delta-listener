export declare type StateObject = {
    [propName: string]: {
        [id: string]: any;
    };
};
export declare type ExplicitStateListener<T extends StateObject> = {
    [P in keyof T]?: (data: {
        [ids: string]: any;
    }) => void;
};
export declare class ExplicitContainer<T extends StateObject> {
    readonly data: T;
    private _data;
    private propKeys;
    private propLength;
    private stateListeners;
    private createListeners;
    private removeListeners;
    constructor(data: T);
    addStateListener(propName: keyof T, callback: (data: T[keyof T]) => void): void;
    addCreateListener(propName: keyof T, callback: (id: string, data: any) => void): void;
    addRemoveListener(propName: keyof T, callback: (id: string, data: any) => void): void;
    removeAllListeners(): void;
    set(newData: T): void;
}
