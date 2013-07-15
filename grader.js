#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Users commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:
 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var sys = require('util');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://vast-brushlands-9767.herokuapp.com/";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)){
	console.log("%s does not exist. Exiting",instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(url) {
    var request = false;
    request = new XMLHttpRequest();
    if(request) request.open("GET",String(url),true);
    request.onreadystatechange = function(){
	if(request.status == 200) 
	    request = true;
	else{
	    console.log(request.status);
	    console.log("%s URL does not exist. Exiting",String(url));
	    process.exit(1);
	}
    }
    request.onreadystatechange;
    return request;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var buildfcn = function(htmlfile,callback) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error in Getting Webpage');
        } else {
            fs.writeFileSync(htmlfile, result);
	    var checkJson = checkHtmlFile(htmlfile,program.checks);
	    var outJson = JSON.stringify(checkJson,null,4);
	    console.log(outJson)
	    callback(htmlfile);
        }
    };
    return response2console;
};



var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile,checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>','Path to checks.json',clone(assertFileExists),CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>','Path to index.html')
	.option('-u, --url <url_name>', 'URL name')
	.parse(process.argv);
    
    //var checkJson = checkHtmlFile(program.file,program.checks);
    if(program.url){
	var urlFileTemp = "temp.html";
	var response2console = buildfcn(urlFileTemp,function(urlfile){fs.unlink(String(urlfile),function(err){if (err) throw err; })});
	var getURL = rest.get(program.url).on('complete', response2console);
    }
    if(program.file){
	var checkJson = checkHtmlFile(program.file,program.checks);
	var outJson = JSON.stringify(checkJson,null,4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}