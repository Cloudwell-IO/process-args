/**
 * Parses the value.
 * @param {string | undefined} value The value to parse.
 * @returns The parsed value
 */
function ProcessArgsParser(value) {
    if (typeof value === "string") {
        if (!isNaN(value)) {
            return Number(value)
        }
        const lowerValue = value.toLocaleLowerCase()
        if (lowerValue === "true") {
            return true
        }
        if (lowerValue === "false") {
            return false
        }
        const firstChar = value.charAt(0)
        if (firstChar === "{" || firstChar === "[") {
            return JSON.parse(value)
        }
    }
    return value
}

/**
 * Gets a parser for a specified argument.
 * @param {string} argument The name of the argument to be parsed.
 * @returns {ProcessArgsParser} A function that can parsed a provided value.
 */
const ProcessArgsGetParser = (argument) => ProcessArgsParser

/**
 * The options for getProcessArgs
 * @param {ProcessArgsOptions} options The options that should override the default values.
 */
function ProcessArgsOptions(options) {
    options = options ?? {}
    /**
     * The arguments to parse.
     * @type {string[]}
     * @default
     * process.argv.slice(2)
     */
    this.arguments = Array.isArray(options.arguments) ? options.arguments.filter(x => typeof x === "string") : process.argv.slice(2)
    /**
     * The values that mark the begining of a named argument.
     * @type {string[]}
     * @default
     * ["--", "-"]
     */
    this.prefixes = Array.isArray(options.prefixes) ? options.prefixes.filter(x => typeof x === "string") : ["--", "-"]
    /**
     * The values that separate an argument name from the value.
     * @type {string[]}
     * @default
     * [":", "="]
     */
    this.delimiters = Array.isArray(options.delimiters) ? options.delimiters.filter(x => typeof x === "string") : [":", "="]
    /**
     * Indicates if each positional argument should maintain the original index in the parsed args.
     * @type {boolean}
     * @default
     * false
     */
    this.keepPositionalIndices = typeof options.keepPositionalIndices === "boolean" ? options.keepPositionalIndices : false
    /** 
     * Gets the parser to use for the argument.
     * @type {ProcessArgsGetParser}
     * @default
     * undefined
     */
    this.getParser = typeof options.getParser === "function" ? options.getParser : undefined
}

/**
 * Gets the arguments provided to the Node command.
 * @param {ProcessArgsOptions} options An optional options object.
 * @default
 * Options
 * ```javascript
 * {
 *   arguments: process.argv.slice(2),
 *   prefixes: ["--", "-"],
 *   delimiters: [":", "="],
 *   keepPositionalIndices: true,
 *   getParser: undefined
 * }
 * ```
 * @returns {{ positional: string[], [x: string]: any }} An object with the parsed arguments.
 */
module.exports = function getProcessArgs(options) {
    this.options = new ProcessArgsOptions(options)
    /**
     * Processes an argument value
     * @param {string | number} name The name or index of the argument
     * @param {string} value The value of the argument
     * @returns The processed value
     */
    const processValue = (name, value) => {
        const nameType = typeof name
        if (nameType === "string" || nameType === "number") {
            let parser = ProcessArgsParser
            if (typeof this.options.getParser === "function") {
                try {
                    const customParser = this.options.getParser(name)
                    if (typeof customParser === "function") {
                        parser = customParser
                    }
                }
                catch (err) {
                    console.log(`Error getting parser for arg ${name}`, err)
                }
            }
            try {
                return parser(value)
            }
            catch (err) {
                console.log(`Error parsing the value for arg ${name}`, value, err)
                return value
            }
        }
    }
    /**
     * Gets the value for the specified argument.
     * @param {string} arg The argument.
     * @returns The possibly delimited value.
     */
    const getValue = (arg) => {
        let identifiedDelimiter = { delimiter: "", index: -1 }
        for (let i = 0; i < this.options.delimiters.length; i++) {
            const delimiter = this.options.delimiters[i]
            if (delimiter) {
                const indexOfDelimiter = arg.indexOf(delimiter)
                if (indexOfDelimiter >= 0 && (identifiedDelimiter.index < 0 || indexOfDelimiter < identifiedDelimiter.index)) {
                    identifiedDelimiter = {
                        delimiter,
                        index: indexOfDelimiter
                    }
                }
            }
        }
        if (identifiedDelimiter.index >= 0) {
            return arg.slice(identifiedDelimiter.index + identifiedDelimiter.delimiter.length)
        }
    }
    const retVal = {
        positional: []
    }
    for (let i = 0; i < this.options.arguments.length; i++) {
        let arg = this.options.arguments[i]
        let isNamedArg = false
        for (let j = 0; j < this.options.prefixes.length; j++) {
            const prefix = this.options.prefixes[j]
            if (arg.startsWith(prefix)) {
                isNamedArg = true
                j = this.options.prefixes.length
                arg = arg.slice(prefix.length)
                const argValue = getValue(arg)
                const nextArg = this.options.arguments[i + 1]
                if (argValue) {
                    const argName = arg.slice(0, arg.length - argValue.length - 1)
                    retVal[argName] = processValue(argName, argValue)
                }
                else if (!nextArg || this.options.prefixes.some(p => nextArg.startsWith(p))) {
                    retVal[arg] = true
                }
                else {
                    retVal[arg] = processValue(arg, nextArg)
                    i++
                }
            }
        }
        if (!isNamedArg) {
            if (this.options.keepPositionalIndices) {
                retVal.positional[i] = processValue(i, arg)
            }
            else {
                retVal.positional.push(processValue(i, arg))
            }
        }
    }
    return retVal
}