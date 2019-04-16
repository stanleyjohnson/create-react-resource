export const createSimpleResource = (initialValue, config = {}) => {
    let cache = { data: initialValue };
    if (typeof config.lsKey === 'string') {
      cache = withLocalStorageSetter(cache, config.lsKey);
    }
    return {
      set: (data) => {
        cache.data = data;
      },
      read: () => {
        return cache.data;
      },
      clear: () => {
        cache.data = null;
      }
    };
  };
  
  const withLocalStorageSetter = (defaultObj, lsKey) => {
    const handler = {
      set(obj) {
        var s = Reflect.set(...arguments);
        localStorage.setItem(lsKey, JSON.stringify(obj));
        return s;
      }
    };
    let lsObj = localStorage.getItem(lsKey);
    if (lsObj) {
      lsObj = JSON.parse(lsObj);
      return new Proxy(lsObj, handler);
    }
    return new Proxy(defaultObj, handler);
  };
  
  // statuses of the cache value
  const EMPTY = 'EMPTY';
  const SUCCESS = 'SUCCESS';
  const ERROR = 'ERROR';
  
  export const createDeclarativeResource = (promise, config = {}) => {
    const cacheNeedsMap = promise.length;
    // using Function.length to check if the promise has keys which need to be used to cache in a map
    if (!cacheNeedsMap) {
      let cache = {
        value: null,
        status: EMPTY
      };
  
      if (typeof config.lsKey === 'string') {
        cache = withLocalStorageSetter(cache, config.lsKey);
      }
  
      return {
        fetch: () => {
          if (cache.status === SUCCESS) {
            return cache.value
          }
          else if (cache.status === ERROR) {
            throw cache.value
          }
          return promise().then((val) => {
            cache.value = val;
            cache.status = SUCCESS;
            return val
          }).catch((err) => {
            cache.value = err;
            cache.status = ERROR;
            throw err
          })
        },
        read: () => {
          if (cache.status === SUCCESS) {
            return cache.value
          }
          else if (cache.status === ERROR) {
            throw cache.value
          }
          throw promise().then((val) => {
            cache.value = val;
            cache.status = SUCCESS;
          }).catch((err) => {
            cache.value = err;
            cache.status = ERROR;
          })
        },
        clear: () => {
          cache.value = null;
          cache.status = EMPTY;
        }
      };
    } else {
      let cache = {
        value: new Map(),
        status: new Map()
      };
  
      if (typeof config.lsKey === 'string') {
        cache = withLocalStorageSetter(cache, config.lsKey);
      }
  
      const getCacheStatus = (keys) => {
        let keysArePresent = isInMap(cache.status, keys);
        if (keysArePresent) {
          return getInMap(cache.status, keys);
        }
        return EMPTY;
      };
  
      return {
        fetch: (...keys) => {
          const status = getCacheStatus(keys)
          if (status === SUCCESS) {
            return getInMap(cache.value, keys);
          }
          else if (status === ERROR) {
            throw getInMap(cache.value, keys);
          }
          return promise(...keys).then((val) => {
            setInMap(cache.value, keys, val);
            setInMap(cache.status, keys, SUCCESS);
            return val;
          }).catch((err) => {
            setInMap(cache.value, keys, err);
            setInMap(cache.status, keys, ERROR);
            throw err
          })
        },
        read: (...keys) => {
          const status = getCacheStatus(keys)
          if (status === SUCCESS) {
            return getInMap(cache.value, keys);
          }
          else if (status === ERROR) {
            throw getInMap(cache.value, keys);
          }
          throw promise(...keys).then((val) => {
            setInMap(cache.value, keys, val);
            setInMap(cache.status, keys, SUCCESS);
          }).catch((err) => {
            setInMap(cache.value, keys, err);
            setInMap(cache.status, keys, ERROR);
          })
        },
        clear: (...keys) => {
          // if the matching keys are provided, clear the corresponding cache else clear everything
          if (keys.length) {
            if (isInMap(cache.status, keys)) {
              setInMap(cache.value, keys, null);
              setInMap(cache.status, keys, EMPTY);
            }
          } else {
            cache.value = new Map();
            cache.status = new Map();
          }
        }
      };
    }
  };
  
  const setInMap = (map, keys, value) => {
    let currentMap = map;
    for (var i = 0; i < keys.length - 1; i++) {
      let key = keys[i];
      if (!currentMap.has(key)) {
        currentMap.set(key, new Map());
      }
      currentMap = currentMap.get(key);
    }
    currentMap.set(keys[i], value);
  };
  
  const getInMap = (map, keys) => {
    let currentValue = map;
    for (var i = 0; i < keys.length; i++) {
      currentValue = currentValue.get(keys[i]);
    }
    return currentValue;
  };
  
  const isInMap = (map, keys) => {
    let currentMap = map;
    for (var i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (currentMap.has(key)) {
        currentMap = currentMap.get(key);
        continue;
      }
      return false;
    }
    return true;
  };
  