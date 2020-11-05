version=`cat package.json | jq ".version" -r`
name=`cat package.json | jq ".name" -r`
package="$name-$version.vsix"

aws s3 cp $package s3://artifacts-prod-artifactb7980f61-19orqnnuurvwy/publish/$package
echo artifacts-prod-artifactb7980f61-19orqnnuurvwy.s3.amazonaws.com/publish/$package