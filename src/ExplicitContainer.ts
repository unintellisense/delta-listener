import { DeltaContainer } from './DeltaContainer';

export type StateObject = {
  [propName: string]: {
    [id: string]: any
  }
}

export type ExplicitStateListener<T extends StateObject> = {
  [P in keyof T]?: (data: {
    [ids: string]: any
  }) => void
}

export class ExplicitContainer<T extends StateObject> {
  get data() { return this._data }
  private _data: T;

  private propKeys: string[]
  private propLength: number

  private stateListeners: ExplicitStateListener<T> = {};

  private createListeners: {
    [P in keyof T]?: (id: string, entity: any) => void
  } = {};

  private removeListeners: {
    [P in keyof T]?: (id: string, entity: any) => void
  } = {};

  constructor(data: T) {
    this._data = data;
    this.propKeys = Object.keys(data);
    this.propLength = this.propKeys.length;
  }

  public addStateListener(propName: keyof T, callback: (data: T[keyof T]) => void) {
    this.stateListeners[propName] = callback;
  }

  public addCreateListener(propName: keyof T, callback: (id: string, data: any) => void) {
    this.createListeners[propName] = callback;
  }

  public addRemoveListener(propName: keyof T, callback: (id: string, data: any) => void) {
    this.removeListeners[propName] = callback;
  }

  public removeAllListeners() {
    this.stateListeners = {};
    this.createListeners = {};
    this.removeListeners = {};
  }

  public set(newData: T): void {

    for (let i = this.propLength - 1; i >= 0; i--) {
      let latestObjKeys = Object.keys(newData[this.propKeys[i]]);
      let priorObjKeys = Object.keys(this._data[this.propKeys[i]]);
      let foundNew = false;

      if (this.stateListeners[this.propKeys[i]]) {
        this.stateListeners[this.propKeys[i]](newData[this.propKeys[i]])
      }

      newLoop:
      for (let j = latestObjKeys.length - 1; j >= 0; j--) { // check the lastObjKeys to see if this is new
        for (let k = priorObjKeys.length - 1; k >= 0; k--) {
          if (latestObjKeys[j] === priorObjKeys[k]) continue newLoop; // we know this object

        }
        foundNew = true;
        if (this.createListeners[this.propKeys[i]]) { // check for add listener and invoke it
          this.createListeners[this.propKeys[i]]
            (latestObjKeys[j], newData[this.propKeys[i]][latestObjKeys[j]])
        }
      }

      if (!foundNew && latestObjKeys.length === priorObjKeys.length)
        continue; // if nothing was added and lengths match, save a iteration
      removeLoop:
      for (let j = priorObjKeys.length - 1; j >= 0; j--) {
        for (let k = latestObjKeys.length - 1; k >= 0; k--) {
          if (priorObjKeys[j] === latestObjKeys[k]) continue removeLoop; // we know this object
        }

        if (this.removeListeners[this.propKeys[i]]) { // check for remove listener and invoke it
          this.removeListeners[this.propKeys[i]]
            (priorObjKeys[i], this._data[this.propKeys[i]][priorObjKeys[i]])
        }
      }
    }
    this._data = newData;
  }


}