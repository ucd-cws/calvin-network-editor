
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

	function LINK_gen(outstr, name, source, dest, val, cost, lower_const, upper_const) {
		return outstr + "LINK      " + name + "      " + source + " " + dest + "   " + val + "     " + cost + "     " + lower_const + "    " + upper_const + "\n";
	} 

	function P_gen(outstr, name, MO, A, B, C, D, E, F) {
		return outstr + name + "       " + " MO=" + MO + " A=" + A + " B=" + B + " C=" + C + " D=" + D + " E=" + E + " F=" + F + "\n";
	}
	function QI_gen(outstr, A, B, C, D, E, F) {
		return outstr + "QI       " + " A=" + A + " B=" + B + " C=" + C + " D=" + D + " E=" + E + " F=" + F + "\n"; 
	}
	function BOUND_gen(outstr, bounds_values) {
		var output = outstr;
		if( bounded_values != '') { //will check if contents fit regex if necessary
			output = output + "BU        " + bounded_values + "\n";
		}
		return output;
	}
	function get_bound_values(thebound, bound_path){
		var output = '';
		if( fs.existsSync(bound_path)){
			var content = fs.readFileSync(bound_path);
			var mydata = String(content).split(",\n");
			var btypecheck = mydata[0].split(",");
			//console.log(btypecheck);
			if( btypecheck[1] == "Monthly\n") {
				var startindex = mydata.indexOf("bound");
				bound_vals = '';
				for( var bindex = startindex + 1; bindex < mydata.length - 1; bindex++) {
					bound_vals = bound_vals + mydata[bindex] + ",";
				}
				
				if( bound_vals != '') { //or passes a regex check
					output = thebound + "        " + bound_vals + "\n";
				}
			}
		}
		return output;
	}


	//path to network data
    var dir = process.argv[2];
	function node_definitions() {
		var outputtext = '';

		nodes_path = dir+'/data/nodes/';
		nodes_list = fs.readdirSync(nodes_path);

		outputtext = outputtext + "..        ***** NODE DEFINITIONS *****\n";
		outputtext = outputtext + "..         \n";


		for(var i = 0; i < nodes_list.length; i++) {
			geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				var initialstorage = '';
				var endingstorage = '';
				var areacapfactor = '';

				if(geojson["properties"]["initialstorage"]) {
					initialstorage = geojson["properties"]["initialstorage"].toFixed(3);
					//since initialstorage exists, then all other variables must
					//be set to 0.00 by default
					endingstorage = '0.00';
					areacapfactor = '0.00';
				}
				if(geojson["properties"]["endingstorage"]) {
					endingstorage = geojson["properties"]["endingstorage"].toFixed(3);
				}
				if(geojson["properties"]["areacapfactor"]) {
					areacapfactor = geojson["properties"]["areacapfactor"].toFixed(3);
				}

				outputtext = outputtext + "NODE     " + geojson["properties"]["prmname"] + " " + initialstorage + " " + areacapfactor + " " + endingstorage + "\n";
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
			console.log(outputtext);
			outputtext = '';
		}
	//	console.log(outputtext);
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
				var type = geojson["properties"]["type"];
				if( type == "Surface Storage" || type == "Ground Storage") {
					
					var upper_const = '';
					var lower_const = '';
					var constraints = geojson["properties"]["constraints"];
					if( constraints ) {
						if(constraints["lower"]["bound"]) {
							lower_const = constraints["lower"]["bound"];
							upper_const = "0.00"; //lower defined means upper must be defined.
						}
 
						if(constraints["upper"]["bound"]) {
							upper_const = constraints["upper"]["bound"];
							if(lower_const == '') {
								lower_const = "0.00"; //upper defined means lower must be defined.
							}
						}
					}
					outputtext = LINK_gen(outputtext, "RSTO", prmname, prmname, "1.000","", lower_const, upper_const);

					var description = geojson["properties"]["description"];

					outputtext = outputtext + "LD        " + type + " " +  description + "\n";

					if( geojson["properties"]["costs"]["type"] == "Monthly Variable") {
						outputtext = outputtext + "EV        A=" + "UCD CAP1" + " B=" + prmname + " C=" + "EVAP_RATE(FT)" + " F=" + description + "\n";
						for( var month_i = 0 ; month_i < 12; month_i++) {
							outputtext = P_gen(outputtext, "PS", months[month_i], "UCD CAP1", prmname , "EQUATION", "", "", "SPECIFIC DATE");
						}
					}
					else if (geojson["properties"]["costs"]["type"] == "Annual Variable") {
					    var mo_label = geojson["properties"]["costs"]["costs"][0]["label"];
						outputtext = P_gen(outputtext,"PS",  mo_label , "UCD CAP1", "DUMMY" , "Q(K$-KAF)", "", "", "");
					}
					else {
						outputtext = P_gen(outputtext,"PS", "ALL", "UCD CAP1", "DUMMY" , "BLANK", "", "", "");
					}

					outputtext = QI_gen(outputtext, "FILENAME", prmname, "STOR", "", "", "");
					outputtext = outputtext + "..        \n";

				}
			}
		}
		console.log(outputtext);
	}

	function divr_definitions() {
		var outputtext = '';


		links_path = dir+'/data/links/';
		links_list = fs.readdirSync(links_path);

		for(var i = 0; i < links_list.length; i++) {

			geojsonfile = links_path + links_list[i] +'/link.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				var prmname = geojson["properties"]["prmname"];
				var origin = geojson["properties"]["origin"];
				var terminus = geojson["properties"]["terminus"];
				var amplitude = geojson["properties"]["amplitude"];
				var type = geojson["properties"]["type"];
				var description = geojson["properties"]["description"];

				if( type == "Diversion") {
					
					var bound_vals = '';
					var PQ = '';
					var upper_const = '';
					var lower_const = '';
					var constraints = geojson["properties"]["constraints"];
					var cost = '';
					
					if( constraints ) {
						if(constraints["lower"]) {
							if(constraints["lower"]["bound"]) { 
								lower_const = constraints["lower"]["bound"];
							}
							if(constraints["lower"]["$ref"]) {
								csvfile = links_path + links_list[i]+ "/" + constraints["lower"]["$ref"];
								bound_vals = get_bound_values("BL", csvfile);
							}
						}
						if(constraints["upper"]) {
							if(constraints["upper"]["bound"]) {
								upper_const = constraints["upper"]["bound"];
							}
							if(constraints["upper"]["$ref"]) {
								csvfile = links_path + links_list[i]+ "/" + constraints["upper"]["$ref"];
								bound_vals = get_bound_values("BU", csvfile);
							}
						}      
					}
					if(geojson["properties"]["costs"]) {
						PQ = '';
						if(geojson["properties"]["costs"]["type"] == "Monthly Variable") {
							month_data = geojson["properties"]["costs"]["costs"];
							for(var costs_i = 0 ; costs_i < month_data.length; costs_i++) {
								var label = month_data[costs_i]["label"];
								PQ =  PQ + P_gen('',"PQ", label, "SOUTH UPDT", origin + "_" + terminus, "Q(K$-KAF)", "", label, "","" );
							}
						}
						if(geojson["properties"]["costs"]["cost"]) {
							cost = geojson["properties"]["costs"]["cost"];
						}
					}
                                        
					outputtext = LINK_gen(outputtext, "DIVR", origin, terminus, amplitude, cost, lower_const, upper_const);

					outputtext = outputtext + "LD        " +  description + "\n";

					outputtext = outputtext + bound_vals;

					outputtext = outputtext + PQ;

					// if( geojson["properties"]["costs"]["type"] == "Monthly Variable") {
					// 	outputtext = outputtext + "EV        A=" + "UCD CAP1" + " B=" + prmname + " C=" + "EVAP_RATE(FT)" + " F=" + description + "\n";
					// 	for( var month_i = 0 ; month_i < 12; month_i++) {
					// 		outputtext = P_gen(outputtext, months[month_i], "UCD CAP1", prmname , "EQUATION", "", "", "SPECIFIC DATE");
					// 	}
					// }
					// else if (geojson["properties"]["costs"]["type"] == "Annual Variable") {
					//     var mo_label = geojson["properties"]["costs"]["costs"][0]["label"];
					// 	outputtext = P_gen(outputtext, mo_label , "UCD CAP1", "DUMMY" , "Q(K$-KAF)", "", "", "");
					// }
					// else {
					// 	outputtext = P_gen(outputtext, "ALL", "UCD CAP1", "DUMMY" , "BLANK", "", "", "");
					// }

					outputtext = QI_gen(outputtext, "FILENAME", origin + "_" + terminus, "FLOW_DIV(KAF)", "", "1MON", "");
					outputtext = outputtext + "..        \n";

				}
			}
		}
		console.log(outputtext);
	}


	//node_definitions();
	//inflow_definitions();
    rsto_definitions();
    //divr_definitions();
}

printdir();
