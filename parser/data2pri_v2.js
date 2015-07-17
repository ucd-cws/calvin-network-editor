var walk = require('./walk');
var fs = require('fs');

var links = {};
var nodes = {};
var nodeskeys = [];
var linkskeys = [];

function loadJSONDataFile(filename) {
	//make sure filename contains ".json"
	if(filename.indexOf(".geojson") < 0) return;

	var geojson;

	//attempt to open and parse geojson file
	try {
		geojson = JSON.parse(fs.readFileSync(filename));

	} catch (err) {
		console.log("Failed parsing JSON file " + filename);
		console.log(err);
	}

	if(!geojson) return;

	//console.log(geojson);

	//check for links or nodes
	if( geojson.properties.type == 'Diversion' || geojson.properties.type == 'Return Flow' ) {
		parseLinks(geojson);
	}
	else {
		parseNodes(geojson);
	}
	
}

function parseNodes(node) {
    if( !node ) return;
    if( !node.properties ) return;
    if( !node.properties.prmname ) return;

	nodes[node.properties.prmname] = node;
	nodeskeys.push(node.properties.prmname);
}

function parseLinks(link){
    if( !link ) return;
    if( !link.properties ) return;
    if( !link.properties.prmname ) return;

	links[link.properties.prmname] = link;
	linkskeys.push(link.properties.prmname);
}

function loadDataUrl(url) {
	
}

function processDirList(err, dirList) {
	if(!err) { 
		//console.log(dirList);
		for(var i = 0; i < dirList.length; i++) {
			//console.log(i + ". " + dirList[i]);
			loadJSONDataFile(dirList[i]);
		}
		
		nodeskeys.sort();
		nodetext = node_definitions(nodeskeys, nodes);
		var homepath = process.env['HOME'] + "/Desktop";
		write_to_file(homepath , "NODE.out", nodetext);
	}
}


function write_to_file(pathname, filename, text) {
	var fullpath = pathname + "/" + filename;
	fs.writeFile(fullpath, text, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("Wrote " + filename);
	});
}

function node_definitions(nodeskeys, nodes_list) {
	var outputtext = '';

	outputtext += "..        ***** NODE DEFINITIONS *****\n";
	outputtext += "..         \n";

	for(var i = 0; i < nodeskeys.length; i++) {
		
		geojson = nodes_list[nodeskeys[i]];
		var initialstorage = '';
		var endingstorage = '';
		var areacapfactor = '';

		if(geojson.properties.initialstorage) {
			initialstorage = geojson.properties.initialstorage;
			//since initialstorage exists, then all other variables must
			//be set to 0.00 by default
			endingstorage = '0.00';
			areacapfactor = '0.00';
		}
		if(geojson.properties.endingstorage) {
			endingstorage = geojson.properties.endingstorage;
		}
		if(geojson.properties.areacapfactor) {
			areacapfactor = geojson.properties.areacapfactor;
		}

		outputtext += "NODE     " + geojson.properties.prmname + " " + initialstorage + " " + areacapfactor + " " + endingstorage + "\n";
		outputtext += "ND       " + geojson.properties.description + "\n";
		outputtext += "..       \n";
	}

	return outputtext;
}



// MAIN program starts here
if(process.argv.length > 1) {
	console.log(process.argv[2]);
	walk.walk(process.argv[2], processDirList)

}
