import { DeltaContainer } from './DeltaContainer';

export type StateObject<M> = {
  [propName: string]: {
    [id: string]: M
  }
}

export type ExplicitStateListener<T extends StateObject<M>, M> = {
  [P in keyof T]?: (data: {
    [ids: string]: M
  }) => void
}

export type CreateListener<T> = (newEntity: T) => void





export class ExplicitContainer<T extends StateObject<M>, M> {

  private data: T;

  private propKeys: string[]
  private propLength: number

  private stateListeners: ExplicitStateListener<T, M> = {};

  private createListeners: {
    
  } = {};

  constructor(data: T) {
    this.data = data;
    this.propKeys = Object.keys(data);
    this.propLength = this.propKeys.length;
  }

  public addStateListener(propName: keyof T, callback: (data: T[keyof T]) => void) {
    this.stateListeners[propName] = callback;
  }

  public addCreatelistener(propName: keyof T, callback: (data: M) => void) { 
    
  }

  public set(newData: T): void {

    for (let i = this.propLength - 1; i >= 0; i--) {
      let latestObjKeys = Object.keys(newData[this.propKeys[i]]);
      let priorObjKeys = Object.keys(this.data[this.propKeys[i]]);
      let foundNew = false;

      for (let j = latestObjKeys.length - 1; j >= 0; j--) { // check the lastObjKeys to see if this is new
        for (let k = priorObjKeys.length - 1; k >= 0; k--) {
          if (latestObjKeys[i] === priorObjKeys[k]) continue; // we know this object
        }
        foundNew = true;
        /* TODO if we got here, invoke add listener on latestObjKeys[i] */
      }

      if (!foundNew && latestObjKeys.length === priorObjKeys.length)
        continue; // if nothing was added and lengths match, save a iteration
      for (let j = priorObjKeys.length - 1; j >= 0; j--) {
        for (let k = latestObjKeys.length - 1; k >= 0; k--) {
          if (priorObjKeys[j] === latestObjKeys[k]) continue; // we know this object
        }
        /* TODO if we got here, invoke remove listener on priorObjKeys[j] */
      }
      if (this.stateListeners[this.propKeys[i]]) {
        this.stateListeners[this.propKeys[i]](newData[this.propKeys[i]])
      }

    }


    this.generate(newData, patches, []);


    this.checkPatches(patches);
    this.data = newData;
    return;
  }

  // Dirty check if obj is different from mirror, generate patches and update mirror
  generate(newData: T, patches: PatchObject[], path: string[]) {

    var newKeys = objectKeys(newData);
    var oldKeys = objectKeys(oldData);
    var changed = false;
    var deleted = false;

    for (var t = oldKeys.length - 1; t >= 0; t--) {
      var prop = oldKeys[t];
      var oldVal = oldData[prop];
      if (newData.hasOwnProperty(prop)  // property still on new data, and...
        && !(newData[prop] === undefined // new data doesnt have the property defined
          && oldVal !== undefined // or old value for this property was defined
          && Array.isArray(newData) === false) // or current NewData isn't a array
      ) {
        var newVal = newData[prop];
        if (typeof oldVal == "object" && // old value was a object, and
          oldVal != null && // old value wasnt null, and 
          typeof newVal == "object" && // new value is object, and
          newVal != null) { // new value isnt null
          // check replace listeners for object level listener
          let newPath = path.concat(prop);
          var match = this.checkObjectReplaceListeners(oldVal, newVal, newPath, patches);
          if (!match) this.generate(oldVal, newVal, patches, newPath);
        }
        else {
          if (oldVal !== newVal) {
            changed = true;
            patches.push({ op: "replace", path: path.concat(prop), value: deepClone(newVal) });
          }
        }
      }
      else {
        patches.push({ op: "remove", path: path.concat(prop) });
        deleted = true; // property has been deleted
      }
    }

    if (!deleted && newKeys.length == oldKeys.length) {
      return;
    }

    for (var t = 0; t < newKeys.length; t++) {
      var prop = newKeys[t];
      if (!oldData.hasOwnProperty(prop) && newData[prop] !== undefined) {
        patches.push({ op: "add", path: path.concat(prop), value: deepClone(newData[prop]) });
      }
    }
  }



}