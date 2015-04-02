
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

	var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

	function LINK_gen(outstr, name, source, dest, cost, lower_const, upper_const) {
		return outstr + "LINK      " + name + "      " + source + " " + dest + "   " + cost + "     " + lower_const + "    " + upper_const + "\n";
	} 

	function PS_gen(outstr, MO,A,B,C,D,E,F) {
		return outstr + "PS       " + " MO=" + MO + " A=" + A + " B=" + B + " C=" + C + " D=" + D + " E=" + E + " F=" + F + "\n";
	}
	function QI_gen(outstr, A,B,C,D,E,F) {
		return outstr + "QI       " + " A=" + A + " B=" + B + " C=" + C + " D=" + D + " E=" + E + " F=" + F + "\n"; 
	}

	//path to network data
    var dir = process.argv[2];
	function node_definitions() {
		//will need to check for directory existence
		var outputtext = '';

		nodes_path = dir+'/data/nodes/';
		nodes_list = fs.readdirSync(nodes_path);

		outputtext = outputtext + "..        ***** NODE DEFINITIONS *****\n";
		outputtext = outputtext + "..         \n";


		for(var i = 0; i < nodes_list.length; i++) {
			geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				outputtext = outputtext + "NODE     " + geojson["properties"]["prmname"] + "\n";
				outputtext = outputtext + "ND       " + geojson["properties"]["description"] + "\n";
				outputtext = outputtext + "..       \n";
			}
		}
        console.log(outputtext);
	}

	function inflow_definitions() {
		var outputtext = '';

		// outputtext = outputtext + "..         \n";
		// outputtext = outputtext + "..         \n";
		// outputtext = outputtext + "..         \n";
		// outputtext = outputtext + "LINK      DIVR      SOURCE    SINK      1.000     0.00\n";
		// outputtext = outputtext + "LD        Continuity Link\n";
		// outputtext = outputtext + "..         \n";
		outputtext = outputtext + "..        ***** INFLOW DEFINITIONS *****\n";
		outputtext = outputtext + "..         \n";


		nodes_path = dir+'/data/nodes/';
		nodes_list = fs.readdirSync(nodes_path);

		for(var i = 0; i < nodes_list.length; i++) {

			geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				var prmname = geojson["properties"]["prmname"];
				if( geojson["properties"]["inflows"] ) {
					
					outputtext = outputtext + "LINK      INFL      SOURCE    " + prmname + "   1.000     0.00\n"

					csvfile = nodes_path + nodes_list[i]+ "/" + geojson["properties"]["inflows"][0]["$ref"];
					var partF = "";
					var LD = ""
					if( fs.existsSync(csvfile)){
						var content = fs.readFileSync(csvfile);
						var firstline = String(content).split("\n")[0];

					    var regex = /[A-Z0-9 _-]+/
						var temp = firstline.split(",")[1];
						LD = temp;

						//part F needs more information to do this
						partF = temp.toUpperCase();
					}

					outputtext = outputtext + "LD        " + LD + "\n";
					outputtext = outputtext + "IN        A="+""+" B=SOURCE_"+prmname+ " C="+"FLOW_LOC(KAF)"+" E="+"1MON"+" F=" + partF + "\n";
					outputtext = outputtext + "..        \n";

				}
			}
		}
		console.log(outputtext);
	}

	function rsto_definitions() {
		var outputtext = '';

		outputtext = outputtext + "..        ***** STORAGE LINK DEFINITIONS *****\n";
		outputtext = outputtext + "..         \n";


		nodes_path = dir+'/data/nodes/';
		nodes_list = fs.readdirSync(nodes_path);

		for(var i = 0; i < nodes_list.length; i++) {

			geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				var prmname = geojson["properties"]["prmname"];
				if( geojson["properties"]["type"] == "Surface Storage" || geojson["properties"]["type"] == "Ground Storage") {
					
					var upper_const = '';
					var lower_const = '';
					
					if( geojson["properties"]["constraints"] ) {
						if(geojson["properties"]["constraints"]["lower"]["bound"]) {
							lower_const = geojson["properties"]["constraints"]["lower"]["bound"];
						}
						if(geojson["properties"]["constraints"]["upper"]["bound"]) {
							upper_const = geojson["properties"]["constraints"]["upper"]["bound"];
						}

					}
					outputtext = LINK_gen(outputtext, "RSTO", prmname, prmname, "1.000", lower_const, upper_const);
					//outputtext = outputtext + "LINK      RSTO      " + prmname + " " + prmname + "   1.000     " + lower_const + "    " + upper_const +"\n"

					var description = geojson["properties"]["description"];

					outputtext = outputtext + "LD        " + geojson["properties"]["type"] + " " +  description + "\n";

					if( geojson["properties"]["costs"]["type"] == "Monthly Variable") {
						outputtext = outputtext + "EV        A=" + "UCD CAP1" + " B=" + prmname + " C=" + "EVAP_RATE(FT)" + " F=" + description + "\n";
						for( var month_i = 0 ; month_i < 12; month_i++) {
							//outputtext = outputtext + "PS        MO=" + months[month_i] + " A=" + "UCD CAP1" + " B=" + prmname + " C=" + "EQUATION" + " D=" + " E=" + " F=" + "SPECIFIC DATE" + "\n";
							outputtext = PS_gen(outputtext, months[month_i], "UCD CAP1", prmname , "EQUATION", "", "", "SPECIFIC DATE");
						}
					}
					else {
						outputtext = PS_gen(outputtext, "ALL", "UCD CAP1", "DUMMY" , "BLANK", "", "", "");
						//outputtext = outputtext + "PS        MO=ALL" + " A=" + "UCD CAP1" + " B=" + "DUMMY" + " C=" + "BLANK" + " D=" + " E=" + " F=" + "\n";
					}

					outputtext = QI_gen(outputtext, "FILENAME", prmname, "STOR", "", "", "");
					//outputtext = outputtext + "QI       " + " A=" + "FILENAME" + " B=" + prmname + " C=" + "STOR" + " D=" + " E=" + "1MON" + " F=" + "\n"; 

					outputtext = outputtext + "..        \n";

				}
			}
		}
		console.log(outputtext);
	}



	//node_definitions();
	//inflow_definitions();
    rsto_definitions();
}

printdir();
