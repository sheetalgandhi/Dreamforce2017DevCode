/*
 * Copyright (C) 2016 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
/*Linter*/
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var linter = require('eslint').linter;
var defaultConfig = require('salesforce-lightning-cli/lib/aura-component-config');
var defaultStyle = require('salesforce-lightning-cli/lib/code-style-rules');
var objectAssign = require('object-assign');
var formatter = require('eslint-friendly-formatter');
var bodyParser = require("body-parser");

function lint(source) {
    var config = {};
    objectAssign(config, defaultConfig);
    config.rules = objectAssign({}, defaultConfig.rules);
    objectAssign(config.rules, defaultStyle.rules);
    source = processSingletonCode(source);
    var messages = linter.verify(source, config, {
        allowInlineConfig: true,
        quiet: true
    });
    return messages;
}
// this computes the first position after all the comments (multi-line and single-line)
// from the top of the code
function afterCommentsPosition(code) {
    var position = 0;
    var match;
    do {
        // /\*.*?\*/
        match = code.match(/^(\s*(\/\*([\s\S]*?)\*\/)?\s*)/);
        if (!match || !match[1]) {
            match = code.match(/^(\s*\/\/.*\s*)/);
        }
        if (match && match[1]) {
            position += match[1].length;
            code = code.slice(match[1].length);
        }
    } while (match);
    return position;
}

function processSingletonCode(code) {
    // transform `({...})` into `"use strict"; exports = ({...});`
    var pos = afterCommentsPosition(code);
    if (code.charAt(pos) === '(') {
        code = code.slice(0, pos) + '"use strict"; exports = ' + code.slice(pos);
        pos = code.lastIndexOf(')') + 1;
        if (code.charAt(pos) !== ';') {
            code = code.slice(0, pos) + ';' + code.slice(pos);
        }
    }
    return code;
}

function processFunctionCode(code) {
    // transform `function () {}` into `"use strict"; exports = function () {};`
    var pos = afterCommentsPosition(code);
    if (code.indexOf('function', pos) === pos) {
        code = code.slice(0, pos) + '"use strict"; exports = ' + code.slice(pos);
        pos = code.lastIndexOf('}') + 1;
        if (code.charAt(pos) !== ';') {
            code = code.slice(0, pos) + ';' + code.slice(pos);
        }
    }
    return code;
}
exports.lintjson = function(jsfile) {
    return new Promise(function(resolve, reject) {
        fs.readFile(jsfile, 'utf8', function(err, data) {
            if (err) {
                return console.log(err);
            }
            var message = lint(data);
            resolve(message);
        });
    });
}
