
var fs = require('fs');

function expand() {
    var editorFs = require('../app/js/fs.js').fs;
    var fs = require('fs');

    if( process.argv.length < 4 ) {
		console.log('invalid args: [repo dir] [prmname]');
		return;
    }

    var prmname = process.argv[3];
    var dir = process.argv[2];

    var geojson = null;
    if( fs.existsSync(dir+'/data/nodes/'+prmname+'/node.geojson') ) {
		geojson = JSON.parse(fs.readFileSync(dir+'/data/nodes/'+prmname+'/node.geojson'));
		geojson.properties._file = dir+'/data/nodes/'+prmname+'/node.geojson';

    } else if ( fs.existsSync(dir+'/data/links/'+prmname+'/link.geojson') ) {
		geojson = JSON.parse(fs.readFileSync(dir+'/data/nodes/'+prmname+'/node.geojson'));
		geojson.properties._file = dir+'/data/links/'+prmname+'/link.geojson';

    }

    if( !geojson ) {
		console.log('invalid prmname: '+prmname);
		return;
    }

    editorFs.loadRefs(geojson, function(){
		delete geojson.properties._file;
		console.log(JSON.stringify(geojson, '', '  '));
		
    });

}

function printdir() {
	//path to network data
    var dir = process.argv[2];
	function node_definitions() {
		//will need to check for directory existence
		
		nodes_path = dir+'/data/nodes/';
		nodes_list = fs.readdirSync(nodes_path);

		console.log("..        ***** NODE DEFINITIONS *****")
		console.log("..         ")
		for(var i = 0; i < nodes_list.length; i++) {
			geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				//			console.log(JSON.stringify(geojson, '', '  '));
				console.log("NODE     " + geojson["properties"]["prmname"])
				console.log("ND       " + geojson["properties"]["description"])
				console.log("..       ")
			}
		}
	}

	function inflow_definitions() {
		console.log("..         ")
		console.log("..         ")
		console.log("..         ")
		console.log("LINK      DIVR      SOURCE    SINK      1.000     0.00")
		console.log("LD        Continuity Link")
		console.log("..         ")
		console.log("..        ***** INFLOW DEFINITIIONS *****")
		console.log("..         ")

		nodes_path = dir+'/data/nodes/';
		nodes_list = fs.readdirSync(nodes_path);
		//console.log(nodes_list)
		for(var i = 0; i < nodes_list.length; i++) {
			console.log("\n" + nodes_list[i] + "\n");
			geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				if( geojson["properties"]["inflows"] ) {
					
					//console.log(JSON.stringify(geojson, '', '  '));
					console.log("LINK      INFL      SOURCE    " + geojson["properties"]["prmname"] + "   1.000     0.00")

					csvfile = nodes_path + nodes_list[i]+ "/" + geojson["properties"]["inflows"][0]["$ref"];
					var partF = "";
					var LD = ""
					//console.log(csvfile);
					if( fs.existsSync(csvfile)){
						var content = fs.readFileSync(csvfile);
						var firstline = String(content).split("\n")[0];

					    var regex = /[A-Z0-9 _-]+/
						var temp = firstline.split(",")[1];
						LD = temp;
						//console.log(matchedstuff[0]);
						//console.log(content.indexOf('\n'));
						//part F needs more information to do this
						partF = temp.toUpperCase();
					}


					console.log("LD        " + LD);
					console.log("IN        A="+""+" B=SOURCE_"+geojson["properties"]["prmname"]+ " C="+"FLOW_LOC(KAF)"+" E="+"1MON"+" F=" + partF);
					console.log("..        ");

				}
			}
		}
	}
	node_definitions();
	inflow_definitions();
}

printdir();
