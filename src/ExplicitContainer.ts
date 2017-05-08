import { DeltaContainer, PatchObject } from './DeltaContainer';

export class ExplicitContainer<T> extends DeltaContainer<T> {
  public set(newData: T): PatchObject[] {

    return;
  }

}