export declare type ExplicitStateObject<M> = {
    [propName: string]: {
        [id: string]: M;
    };
};
export declare type ExplicitStateListener<T extends ExplicitStateObject<M>, M> = {
    [P in keyof T]?: (data: {
        [ids: string]: M;
    }) => void;
};
export declare class ExplicitContainer<T extends ExplicitStateObject<M>, M> {
    readonly data: T;
    _data: T;
    private propKeys;
    private propLength;
    private stateListeners;
    private createListeners;
    private removeListeners;
    constructor(data: T);
    addStateListener(propName: keyof T, callback: (data: T[keyof T]) => void): void;
    addCreateListener(propName: keyof T, callback: (data: M) => void): void;
    addRemoveListener(propName: keyof T, callback: (data: M) => void): void;
    removeAllListeners(): void;
    set(newData: T): void;
}
