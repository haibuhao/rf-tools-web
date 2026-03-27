const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');
code = code.replace('window.addEventListener("DOMContentLoaded", init);', '');

global.document = {
    getElementById: function(id) {
        if (!global[id]) {
            global[id] = { value: "1", addEventListener: () => {} };
        }
        return global[id];
    }
};
global.$ = global.document.getElementById;

try {
    eval(code);
    init();
    console.log("SUCCESS");
} catch(e) {
    console.log("FAILURE", e);
}
