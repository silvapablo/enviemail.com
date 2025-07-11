// Browser polyfill for Node.js util module
export const deprecate = (fn, msg) => {
  let warned = false;
  return function deprecated(...args) {
    if (!warned) {
      console.warn(msg);
      warned = true;
    }
    return fn.apply(this, args);
  };
};

export default {
  deprecate
};