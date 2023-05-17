const getProcessArgs = require("./index")

const args = getProcessArgs()

console.log(JSON.stringify(args, null, 2))

/*

Command:
node debug.js -test -testEquals=equals_pass p-index-4 -testColon:colon_pass p-index-7 -testSpace space_pass --double-hyphen --number:123.5 -boolean:true --json "{"array":[],"object":{},"string":"string value"}"

Output:
{
  "positional": [
    "p-index-4",
    "p-index-7"
  ],
  "test": true,
  "testEquals": "equals_pass",
  "testColon": "colon_pass",
  "testSpace": "space_pass"
}
*/