const store = new Map<string, any>();

export const once =
  (key: string, force: boolean = false) =>
  (_: any, __: string, descriptor: PropertyDescriptor) => {
    if (!descriptor.value) {
      throw new Error('decorator only support method');
    }

    const orginMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      if (store.has(key) && !force) {
        return store.get(key);
      }
      const value = await orginMethod.apply(this, args);
      store.set(key, value);
      return value;
    };
  };

export const syncOnce =
  (key: string, force: boolean = false) =>
  (_: any, __: string, descriptor: PropertyDescriptor) => {
    if (!descriptor.value) {
      throw new Error('decorator only support method');
    }

    const orginMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      if (store.has(key) && !force) {
        return store.get(key);
      }
      const value = orginMethod.apply(this, args);
      store.set(key, value);
      return value;
    };
  };
