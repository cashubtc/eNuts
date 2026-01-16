import * as c from "expo-crypto";

console.log("shim.ts - starting crypto polyfill");

// Create a comprehensive crypto polyfill that handles all scenarios
function setupCryptoPolyfill() {
  // Create a wrapper for getRandomValues that matches Web Crypto API signature
  const getRandomValuesWrapper = <T extends ArrayBufferView | null>(array: T): T => {
    if (!array) {
      throw new TypeError("getRandomValues called with null or undefined");
    }

    // Check if it's a valid TypedArray for crypto operations
    const validTypes = [
      "Int8Array",
      "Uint8Array",
      "Uint8ClampedArray",
      "Int16Array",
      "Uint16Array",
      "Int32Array",
      "Uint32Array",
      "BigInt64Array",
      "BigUint64Array",
    ];

    const typeName = array.constructor.name;
    if (!validTypes.includes(typeName)) {
      throw new TypeError(`getRandomValues called with unsupported type: ${typeName}`);
    }

    // Cast to the expected type and call expo-crypto
    const result = c.getRandomValues(array as any);
    return result as T;
  };

  // Define a proper crypto object with all necessary methods
  const cryptoPolyfill = {
    getRandomValues: getRandomValuesWrapper,
    randomUUID:
      c.randomUUID ||
      (() => {
        // Fallback UUID generation if not available
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c == "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }),
    subtle: undefined, // Not needed for most cases
    // Add other crypto methods from expo-crypto
    digest: c.digest,
    digestStringAsync: c.digestStringAsync,
    getRandomBytes: c.getRandomBytes,
    getRandomBytesAsync: c.getRandomBytesAsync,
  };

  // Set up global crypto object
  if (typeof globalThis !== "undefined") {
    if (!globalThis.crypto) {
      // @ts-expect-error - polyfill assignment
      globalThis.crypto = cryptoPolyfill;
    } else if (!globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues = cryptoPolyfill.getRandomValues;
    }
  }

  // Set up global.crypto
  if (typeof global !== "undefined") {
    if (!global.crypto) {
      // @ts-expect-error - polyfill assignment
      global.crypto = cryptoPolyfill;
    } else if (!global.crypto.getRandomValues) {
      global.crypto.getRandomValues = cryptoPolyfill.getRandomValues;
    }
  }

  // Set up window.crypto if in browser environment
  if (typeof window !== "undefined") {
    if (!window.crypto) {
      // @ts-expect-error - polyfill assignment
      window.crypto = cryptoPolyfill;
    } else if (!window.crypto.getRandomValues) {
      window.crypto.getRandomValues = cryptoPolyfill.getRandomValues;
    }
  }

  // Also set up self.crypto for web workers
  if (typeof self !== "undefined" && self !== global) {
    if (!self.crypto) {
      // @ts-expect-error - polyfill assignment
      self.crypto = cryptoPolyfill;
    } else if (!self.crypto.getRandomValues) {
      self.crypto.getRandomValues = cryptoPolyfill.getRandomValues;
    }
  }

  console.log("shim.ts - crypto polyfill setup complete");
  console.log("Available crypto methods:", Object.keys(global.crypto || {}));
}

// Run the polyfill immediately
setupCryptoPolyfill();

// Also set up a fallback check that runs after a short delay
setTimeout(() => {
  if (typeof global?.crypto?.getRandomValues === "undefined") {
    console.log("shim.ts - crypto.getRandomValues still undefined, retrying...");
    setupCryptoPolyfill();
  }
}, 100);

// Test the polyfill to make sure it works
try {
  console.log("shim.ts - testing crypto.getRandomValues...");
  const testArray = new Uint8Array(10);
  const result = global.crypto.getRandomValues(testArray);
  console.log("shim.ts - crypto.getRandomValues test successful:", result.length === 10);
} catch (error) {
  console.error("shim.ts - crypto.getRandomValues test failed:", error);
}

/* if (typeof Buffer === 'undefined') {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
	global.Buffer = require('buffer/').Buffer as typeof import('buffer').Buffer
}
if (typeof __dirname === 'undefined') { global.__dirname = '/' }
if (typeof __filename === 'undefined') { global.__filename = '' }
*/
