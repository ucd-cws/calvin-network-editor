/* handles adding, updating and removing nodes / links */
if( !window.CWN ) window.CWN = {};

CWN.fs = (function(){
    var fs = requireNode('fs');
    var async = requireNode('async');
    var csvParse = requireNode('csv-parse');
    var csvStringify = requireNode('csv-stringify');

    var linkTypes = ['Diversion', 'Return Flow'];

    var root = '';


    /*
        get the folder from the prmname
    */
    function getFolderName(prmname) {
        return prmname.replace(/[^a-zA-Z0-9-]/g,'_');
    }

    /*
        Takes object 'data' and adds nodes/links:
        data = []
    */
    function addUpdate(data, callback) {
        
        async.eachSeries(data,
            function(nodeLink, next){

                // first see if is new, we will now if it has a _file property or not
                if( !nodeLink.properties._file ) {
                    var type = 'node';
                    if( linkTypes.indexOf(nodeLink.properties.type) > -1 ) {
                        type = 'link';
                    }
                    nodeLink.properties._file = root + '/data/' + type + 
                        's/' + getFolderName(nodeLink.properties.prmname) + '/' + type + '.geojson';
                }

                updateNode(nodeLink, next);
            },
            function(err) {
                updateNetworkOverview();
                callback();
            }
        );
    }

    /*
        Given a node or link, create folder if needed, save all $ref data, clean out _ properties
        then save node/link
    */
    function updateNode(node, callback) {
        var clone = $.extend(true, {}, node);

        var file = clone.properties._file;
        var folder = file.replace(/(link|node)\.geojson/,'');

        if( !fs.existsSync(folder) ) fs.mkdirSync(folder);

        saveRefs(clone, true, function(processed){
            // TODO: should check filesystem with processed array to see if any $ref files where deleted

            // remove all node.properties._*
            _clean(clone);

            if( fs.existsSync(file) ) {
                fs.unlinkSync(file);
            }

            fs.writeFile(file, JSON.stringify(clone, '', '  '), callback);
        });
    }

    /*
        given the current state of the filesystem, generate a new network.geojson file
    */
    function updateNetworkOverview() {
        var nodes;
        var data = load(true);
        nodes = data.nodes;
        
        for( var i =0; i < data.links.length; i++ ) {
            nodes.push(data.links[i]);
        }

        var geojson = { 
            type: "FeatureCollection",
            features : nodes
        }

        if( fs.existsSync(root+'/network.geojson') ) {
            fs.unlinkSync(root+'/network.geojson')
        }

        fs.writeFileSync(root+'/network.geojson', JSON.stringify(geojson, '', '  '));
    }

    /*
        Set the root directory
    */
    function init(dir) {
        root = dir;
    }

    /*
        Loads entire network from dist
    */
    function load(noFileProperty) {
        refs = {};
        var data = {
            nodes : [],
            links : []
        };

        var nodes = fs.readdirSync(root+'/data/nodes');
        for(var i = 0; i < nodes.length; i++ ) {
            var jsonFile = root+'/data/nodes/'+nodes[i]+'/node.geojson';
            if( !fs.existsSync(jsonFile) ) continue;

            var str = fs.readFileSync(jsonFile);
            var node = JSON.parse(str);
            if( !noFileProperty ) node.properties._file = jsonFile
            data.nodes.push(node);
        }

        var links = fs.readdirSync(root+'/data/links');
        for(var i = 0; i < links.length; i++ ) {
            var jsonFile = root+'/data/links/'+links[i]+'/link.geojson';
            if( !fs.existsSync(jsonFile) ) continue;

            var str = fs.readFileSync(jsonFile);
            var link = JSON.parse(str);
            if( !noFileProperty ) link.properties._file = jsonFile;
            data.links.push(link);
        }

        return data;
    }


    /*
        When you want to load/save references, each file is handled in async manor
        this lets you known when all the entire object has been crawled and
        all references handled
    */
    var RefHandler = function(callback) {
        var loading = 0;
        var crawled = false;
        var removeData = false;
        // this array is returned in the callback, let's others know what files
        // were process. useful for knowing what to delete (ie, what files on)
        // disk are no longer part of the node/link.
        var processed = [];

        function checkDone() {
            if( crawled && loading == 0 ) callback(processed);
        }

        function setCrawled() {
            crawled = true;
            checkDone();
        }

        function setLoading(filename) {
            processed.push(filename);
            loading++;
        }

        function setLoaded() {
            loading--;
            checkDone();
        }

        function setRemoveData(remove) {
            removeData = remove;
        }

        function shouldRemoveData() {
            return removeData;
        }

        return {
            setCrawled : setCrawled,
            setLoading : setLoading,
            setLoaded  : setLoaded,
            setRemoveData : setRemoveData,
            shouldRemoveData : shouldRemoveData
        }
    }

    /*
        given a geojson load and data that contains $ref
    */
    function loadRefs(geojson, callback) {
        var rootDir = geojson.properties._file.replace(/(link|node)\.geojson/,'');

        var handler = new RefHandler(callback);
        _crawlRefs(geojson.properties, rootDir, handler, 'load');
        handler.setCrawled();
    }

    /*
        given a geojson save all $ref data.  remove flag actually removes data attributes from
        object when saved.
    */
    function saveRefs(geojson, remove, callback) {

        var rootDir = geojson.properties._file.replace(/(link|node)\.geojson/,'')

        var handler = new RefHandler(callback);
        if( remove ) handler.setRemoveData(true);

        _crawlRefs(geojson.properties, rootDir, handler, 'save');
        handler.setCrawled();
    }

    /*
        crawl an object for $ref, handler keeps track of crawl/load state,
        operation is load or save
    */
    function _crawlRefs(obj, dir, handler, operation) {
        if( Array.isArray(obj) ) {
            for( var i = 0; i < obj.length; i++ ) {
                _crawlRefs(obj[i], dir, handler, operation);
            }
            return;
        }

        for( var key in obj ) {
            if( key == '$ref' ) {
                if( operation == 'load' ) _loadRef(obj, dir, handler);
                else if ( operation == 'save' ) _saveRef(obj, dir, handler)
            
            } else if ( typeof obj[key] == 'object' ) {
                _crawlRefs(obj[key], dir, handler, operation);
            }
        }
    }

    /*
        load a object that has $ref, handler keeps track of overall load/crawl state
    */
    function _loadRef(obj, dir, handler) {
        var file = dir+obj.$ref;

        if( !fs.existsSync(file) ) {
            console.log('Attempting to load missing $ref: '+file);
            return;
        }
        
        handler.setLoading(obj.$ref);
        fs.readFile(file, function(data){

            if( obj.$ref.match(/\.csv$/) ) {
                try {
                    csvParse(data, {comment: '#'}, function(err, output) {
                        handler.setLoaded();
                        if( err ) return console.log(err);
                        obj.data = output;

                    });
                } catch(e) {
                    handler.setLoaded();
                    console.log('Error parsing csv $ref: '+file);
                }

            } else {
                obj.data = data;
                handler.setLoaded();
            }
        });
    }

    /*
        save $ref to file, handler keeps track of overall load/crawl state
    */
    function _saveRef(obj, dir, handler) {
        if( obj.data === undefined ) return;

        var file = dir+obj.$ref;
        if( fs.existsSync(file) ) fs.unlinkSync(file);
        
        handler.setLoading(obj.$ref);

        var data = obj.data;
        if( handler.shouldRemoveData() ) {
            delete obj.data;
        }
        if( !data ) data = '';

        if( obj.$ref.match(/\.csv$/) ) {
            csvStringify(data, function(err, output){
                fs.writeFile(file, output, function(){
                    handler.setLoaded();
                });
            });
        } else {
            fs.writeFile(file, data, function(){
                handler.setLoaded();
            });
        }
    }

    function _clean(geojson) {
        for( var key in geojson.properties ) {
            if( key[0] == '_' ) delete geojson.properties[key];
        }
    } 

    return {
        load : load,
        getFolderName : getFolderName,
        init : init,
        addUpdate : addUpdate
    }

})();