const fs = require('fs');

global.document = {
    getElementById: function(id) {
        if (!global[id]) {
            global[id] = { value: "1", addEventListener: () => {}, innerHTML: "", style: {} };
        }
        return global[id];
    },
    querySelectorAll: () => []
};
global.$ = global.document.getElementById;
global.window = {
    addEventListener: () => {},
    BAND_DATA: {},
    COMPONENTS_DATA: { STD_C: [1, 2], STD_L: [1, 2] }
};

const script3 = fs.readFileSync('app.js', 'utf8');

try {
  eval(script3);
  init();
  console.log("SUCCESS!");
} catch (e) {
  console.log("ERROR OCCURRED:");
  console.log(e);
}
