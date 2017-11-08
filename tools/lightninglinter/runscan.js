/*
 * Copyright (C) 2017 salesforce.com, inc.
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


// Flow of the program in sequence
// 1) traverse the directories from the path provided.
// 2) traverse the files from the respective directories.
// 3) fire http request sequentially from the traversed files.
// 4) After all http requests are returned via promises 
//    restructure the returned results to be fed to pdf generator.
// 5) Generate pdf and store it in report older.  
/* Node Modules required.*/
var fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
};
var fs = require('fs');
var path = require('path');
var scanpath;
var dir = require('node-dir');
var EXTENSION = '.js';
var Promise = require('promise');
var PdfPrinter = require('pdfmake');
var walk = require('walk');
var files = [];
/* Global Variables*/
var printer = new PdfPrinter(fonts);
var filesToScan = {};
var filesScannedbyService;
var lintingServicePromises = [];
var aurascan = require('./lintingService.js');
var json2xml = require('json2xml');
const tableBody = [];

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " The Path parameter/argument is missing");
    process.exit(-1);
}
scanpath = process.argv[2];
//aurascan.lintjson(jsfile);
console.log('We are pulling files from this path: ' + scanpath);
walkallFiles(scanpath).then(function(filesToScan) {
    console.log('1.->Reading files from aura folder an filtering .js files.');
    for (var k in filesToScan) {
        if (filesToScan.hasOwnProperty(k)) {
            console.log('--->2. Run local linting Service on File ' + k );
            lintingServicePromises.push(runlintingService(k, filesToScan[k]));
        }
    }
    Promise.all(lintingServicePromises).then(function(results) {
        console.log('3.--------> Transforming returned data to XML report');
        fs.writeFile('LightningLinterReport.xml', json2xml(JSON.parse((JSON.stringify(results)).replace(/\//g, '~'))));
        //fs.writeFile('LightningLinterReport.xml', json2xml(results));
        console.log('------>4. Transforming returned data from http to feed the pdf generator');
        filesScannedbyService = results;
        sanitizePayload(filesScannedbyService).then(function(tableresults) {
            
            var tableresult = [];
            tableresult = tableresults;
            createdocDefinition(tableresults).then(function(docDefinition) {
                console.log('--------->5. Generating pdf report');
                var pdfDoc = printer.createPdfKitDocument(docDefinition);
                // cannot timestamp beacuse Jenkins picks all pdf reports and 
                //not the one generated from the run
                //pdfDoc.pipe(fs.createWriteStream('report/LighntingLinterReport_'+Date.now()+'.pdf'));
                pdfDoc.pipe(fs.createWriteStream('report/LightningLinterReport.pdf'));
                pdfDoc.end();               
                console.log('---------->6. BooYah.. check the report folder');
            });
        });
    }, function(err) {
        console.log(' An error has occurred in handling one of the http promises');
    });
});

function walkallFiles(filepath) {
    return new Promise(function(resolve, reject) {
        var walker = walk.walk(filepath, {
            followLinks: false
        });
        walker.on('file', function(root, stat, next) {
            // Add this file to the list of files
            if (stat.name.match('.js')) {
                files.push(root + '/' + stat.name);
            }
            next();
        });
        walker.on('end', function() {
            var fileslength = files.length;
            var i = 0;
            files.forEach(function(filename) {
                fs.readFile(filename, 'utf8', function(err, data) {
                    if (err) throw err;
                    filesToScan[filename] = data;
                    if (i + 1 == fileslength) {
                        resolve(filesToScan);
                    }
                    i++;
                });
            });
        });
    });
};

function createdocDefinition(tableresults) {
    var docDef;
    return new Promise(function(resolve, reject) {
        docDef = {
            pageOrientation: "landscape",
            pageSize: "LETTER",
            background: [{
                image: 'images/salesforce_logo.png',
                width: 40,
                absolutePosition: {
                    x: 375,
                    y: 575,
                },
            }],
            content: [{
                image: 'images/salesforce_logo.png',
                width: 100,
                height: 60,
                absolutePosition: {
                    x: 60,
                    y: 10
                },
            }, {
                image: 'images/lightning_logo.png',
                width: 60,
                height: 60,
                absolutePosition: {
                    x: 600,
                    y: 10
                },
            }, {
                text: 'Lightning/Aura Static Code Analyzer',
                style: 'header'
            }, {
                style: 'tableExample',
                table: {
                    widths: [25, 120, 100, 25, 150, 25, 25, 200],
                    headerRows: 1,
                    body: tableresults,
                },
                layout: {
                    fillColor: function(i, node) {
                        return (i % 2 === 0) ? '#CCCCCC' : null;
                    }
                },
            }, ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [30, 30, 0, 10],
                },
                tableExample: {
                    fontSize: 8,
                    bold: true,
                },
            },
            defaultStyle: {
                //alignment: 'justify',
            }
        };
        resolve(docDef);
    });
};
// function to sanitize data returned from Heroku service so that we can visualize in pdf format.
function sanitizePayload(filesScanned) {
    var numberofFilestoScan = filesScanned.length;
    var j = 0;
    return new Promise(function(resolve, reject) {
        tableBody.push(['S:No', 'File', 'Rule', 'Severity', 'Message', 'Line', 'Column', 'Source']);
        for (var i = 0, l = filesScanned.length; i < l; i++) {
            var obj = filesScanned[i];
            fileloop: for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                    // do stuff
                    var file = property;
                    var jsonPayload = {};
                    if (typeof(obj[property]) !== "undefined" && obj[property] !== null) {
                        jsonPayload = obj[property];
                        if (jsonPayload === '[]') {
                            break fileloop;
                        }
                    }
                    for (var key in jsonPayload) {
                        var number = j + 1;
                        var rule = JSON.stringify(jsonPayload[key].ruleId);
                        var severity = JSON.stringify(jsonPayload[key].severity);
                        var message = JSON.stringify(jsonPayload[key].message);
                        var line = JSON.stringify(jsonPayload[key].line);
                        var column = JSON.stringify(jsonPayload[key].column);
                        var source = jsonPayload[key].source;
                        //if (!message.includes("Invalid Aura API")) {
                            tableBody.push([number, file, rule, severity, message, line, column, source]);
                        //}
                        j++
                    }
                    if (i + 1 == numberofFilestoScan) {
                        resolve(tableBody);
                    }
                }
            }
        }
    });
};
// Need to wrap raw linting message payload in promise 
function runlintingService(filepath, content) {
    var fileJSONpayload = {};
    return new Promise(function(resolve, reject) {
        aurascan.lintjson(filepath).then(function(str) {
            fileJSONpayload[filepath] = str;
            resolve(fileJSONpayload);
        });
    });
};