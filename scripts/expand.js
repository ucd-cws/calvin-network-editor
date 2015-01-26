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
