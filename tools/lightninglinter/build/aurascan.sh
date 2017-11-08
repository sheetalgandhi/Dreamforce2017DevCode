 #!/bin/bash
echo "Starting Linter scan Scan"
aura_absolutepath=../../src/aura
echo "The src absolute path :$aura_absolutepath"
#cd ../
cd ../tools/lightninglinter
pwd
ls
node -v
rm -rf node_modules
npm install
node runscan.js $aura_absolutepath
