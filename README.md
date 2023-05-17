# Cloudwell Process Args
A lightweight, dependency free, flexible, utility function to simplify working with Node process arguments.

## How to install:
```
npm i @cloudwell/process-args
```

## How to use:
```javascript
// Bring in the function from the package
const getProcessArgs = require("@cloudwell/process-args")

// Parse the arguments from the process
const args = getProcessArgs()

// Log the parsed arguments
console.log(args)

/*

Save this script and run it with node.

Command:
node script.js --my-arg Value

Output:
{
  "my-arg": "Value"
}

*/
```