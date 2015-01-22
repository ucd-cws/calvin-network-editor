if( !window.CWN ) window.CWN = {};

/* 
    helper functions for runing git shell commands as the nodegit library is not getting us where we need to be 
*/ 

/*
    Note, stdout seems to be going to stderr... but git commands to send back error codes
    on error, so check if error and pipe output from there
*/
CWN.git = (function(){

    var exec = requireNode('child_process').exec;

    function clone(dir, url, callback) {
        exec('cd '+dir+' && git clone '+url,  function (error, stdout, stderr) {
            _handleGitResponse(error, stdout, stderr, callback);
        }.bind(this));
    }

    function status(dir, callback) {
        exec('cd '+dir+' && git status',  function (error, stdout, stderr) {
            _handleGitResponse(error, stdout, stderr, callback);
        }.bind(this));
    }

    function getCurrentBranch(dir, callback) {
        exec('cd '+dir+' && git branch -l',  function (error, stdout, stderr) {
            if( !error ) {
                stdout = stdout+stderr;
                stdout = stdout.split('\n');
                for( var i = 0; i < stdout.length; i++ ) {
                    if( stdout[i].length > 0 && stdout[i][0] == '*' ) {
                        stdout = stdout[i].replace(/^\* /,'');
                        break;
                    }
                }
                if( typeof stdout != 'string' ) stdout = '';
            }

            _handleGitResponse(error, stdout, stderr, callback);
        }.bind(this));
    }

    function _handleGitResponse(error, stdout, stderr, callback) {
        if( error ) {
            console.log(error);
            callback(stdout+stderr);
            return;
        }
        callback(null, stdout+stderr);
    }

    return {
        clone : clone,
        status : status,
        getCurrentBranch : getCurrentBranch
    }

})();