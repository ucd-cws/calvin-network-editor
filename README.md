# calvin-network-editor
Node-Webkit Application for editing the CALVIN DB network data

## Setup Dev Environment

Requirements
- [Node.js & NPM](http://nodejs.org/)
- [Grunt](http://gruntjs.com/)
- [Bower](http://bower.io/)

```
# Create root folder for repo's
mkdir calvin
cd calvin

# clone the calvin network webapp
# TODO: move to GitHub and make public
git clone https://[username]@bitbucket.org/ucd-cws/ca-water-network.git

# initialize repo
cd ca-water-network
npm install
bower install

# clone editor repo
cd ..
git clone https://github.com/ucd-cws/calvin-network-editor.git
cd calvin-network-editor
npm install
bower install

# fire up editor
grunt run

# build for deployment
grunt build
```

Note.  It's important the two repo's share a parent as the calvin-network-editor bootstraps the ca-water-network webapp.

The root data repo, [calvin-network-data](https://github.com/ucd-cws/calvin-network-data), can be cloned using git.  You can also use the editor to clone the repo or fork the repo into your account or an organization you belong to.

## Commands
- **ctrl + r**: refresh app
- **ctrl + i**: open devtools

