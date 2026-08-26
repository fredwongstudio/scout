const assert = require("assert");

const {
  getAirlineName,
  normalizeAirlineCode
} = require("./airline-repository");

assert.strictEqual(getAirlineName("TR"), "Scoot");
assert.strictEqual(getAirlineName(" sq "), "Singapore Airlines");
assert.strictEqual(getAirlineName("00"), null);
assert.strictEqual(normalizeAirlineCode(" tr "), "TR");

console.log("PASS: deployed airline resolver resolves known codes safely");
