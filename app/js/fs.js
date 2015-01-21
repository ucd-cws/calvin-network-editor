/* handles adding, updating and removing nodes / links */
if( !window.CWN ) window.CWN = {};

CWN.fs = (function(){
    var fs = requireNode('fs');
    var csvParse = requireNode('csv-parse');
    var csvStringify = requireNode('csv-stringify');

    var linkTypes = ['Diversion', 'Return Flow'];

    var root = '';


    /*
        Takes object 'data' and adds nodes/links:
        data = {
            nodes : [],
            links : []
        }
    */
    function add(data) {
        
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
    function load() {
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
            node.properties._file = jsonFile
            data.nodes.push(node);
        }

        var links = fs.readdirSync(root+'/data/links');
        for(var i = 0; i < links.length; i++ ) {
            var jsonFile = root+'/data/links/'+links[i]+'/link.geojson';
            if( !fs.existsSync(jsonFile) ) continue;

            var str = fs.readFileSync(jsonFile);
            var link = JSON.parse(str);
            link.properties._file = jsonFile;
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
        var processed = [];

        function checkDone() {
            if( crawled && loading == 0 ) callback(processed);
        }

        function setCrawled() {
            this.crawled = true;
            checkDone();
        }

        function setLoading(filename) {
            processed.push(filename);
            this.loading++;
        }

        function setLoaded() {
            this.loading--;
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
        var rootDir = geojson.properties._file.replace(/(link|node)\.geojson/,'')

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
        init : init,
        add : add
    }

})();