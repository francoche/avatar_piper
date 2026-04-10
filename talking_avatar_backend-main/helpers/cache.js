const cacheMemoria = new Map();

function getCache(key) {
  return cacheMemoria.get(key);
}

function setCache(key, value) {
  cacheMemoria.set(key, value);
}

function hasCache(key) {
  return cacheMemoria.has(key);
}

module.exports = {
  getCache,
  setCache,
  hasCache
};
