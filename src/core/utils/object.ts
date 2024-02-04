/**
 * Clone nested object
 * @param obj
 */
export function cloneDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(cloneDeep) as T;
  } else if (obj && typeof obj === "object") {
    const cloned = {};
    const keys = Object.keys(obj);
    for (let i = 0, l = keys.length; i < l; i++) {
      const key = keys[i];
      cloned[key] = cloneDeep(obj[key]);
    }
    return cloned as T;
  }
  return obj;
}

/**
 * Clone object, exclude some keys
 * If excludeAll is true, remove all matching keys in object. Else, remove a matching key. ExcludeAll default is false
 * @param obj
 * @param exclude
 */
export const cloneObject = (obj: object, exclude?: { keys: Array<string>; excludeAll?: boolean }): object => {
  const newObj = cloneDeep(obj);
  if (exclude) {
    if (exclude.excludeAll) {
      for (let i = 0; i < exclude.keys.length - 1; i++) {
        removeAllKeys(newObj, exclude.keys[i]);
      }
    } else {
      for (let i = 0; i < exclude.keys.length - 1; i++) {
        removeKey(newObj, exclude.keys[i]);
      }
    }
  }
  return newObj;
};
/**
 * This function allowed to remove all matching keys in nested object
 * @param obj
 * @param key
 */
export const removeAllKeys = (obj: object, key: string) => {
  delete obj[key];
  Object.values(obj).forEach(val => {
    if (typeof val !== "object" || val === null) {
      return true;
    }
    removeAllKeys(val, key);
  });
};

/**
 * Remove a matching key in nested object
 * @param obj
 * @param key
 */
export const removeKey = (obj: object, key: string) => {
  const keyArr = key.split(".");
  for (let i = 0; i < keyArr.length - 1; i++) {
    obj = obj[keyArr[i]];
  }
  delete obj[keyArr.pop()];
};

export const extend = Object.assign;

/**
 * Get all values of an object as array
 * @param obj
 */
export const getObjectValues = (obj: object): unknown[] => {
  return Object.values(obj);
};

/**
 * Làm tròn các giá trị type number trong obj (dùng cho bounding box element)
 * @param obj
 * @returns
 */
export const roundValueInsideObj = (obj: Record<string, number>): Record<string, number> => {
  const newObj = {};
  Object.entries(obj).forEach(([key, val]) => {
    newObj[key] = Math.round(val);
  });
  return newObj;
};

/**
 * Rename key name trong obj
 * @param obj
 * @param key
 * @param newKey
 * @returns
 */
export const renameKey = (obj, key, newKey) => {
  const clone = obj => Object.assign({}, obj);
  const clonedObj = clone(obj);
  const targetKey = clonedObj[key];
  delete clonedObj[key];
  clonedObj[newKey] = targetKey;
  return clonedObj;
};
