import { DeltaContainer, PatchObject } from './DeltaContainer';
export declare class ExplicitContainer<T> extends DeltaContainer<T> {
    set(newData: T): PatchObject[];
}
