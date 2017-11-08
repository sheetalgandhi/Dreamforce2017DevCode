#!/bin/bash

echo "Starting PMD Scan"
x=$(pwd)
#src_absolutepath=../../src/
src_absolutepath=./src/

echo "The src absolute path :$src_absolutepath"
echo "The current working directory : $x"
cd ../
pwd
ls
#delete previous scan report
rm ./results/pmdresults.html
#./bin/run.sh pmd -d $src_absolutepath -f html -R ./ruleset/apexrules.xml,./ruleset/vfrules.xml,./ruleset/jsrules.xml,./ruleset/javarules.xml, -reportfile ./results/pmdresults.html -D -failOnViolation false
./tools/pmd/bin/run.sh pmd -d $src_absolutepath -f html -R ./tools/pmd/ruleset/apexrules.xml,./tools/pmd/ruleset/vfrules.xml,./tools/pmd/ruleset/jsrules.xml,./tools/pmd/ruleset/javarules.xml, -reportfile ./tools/pmd/results/pmdresults.html -D -failOnViolation false