version=`cat package.json | jq ".version" -r`
name=`cat package.json | jq ".name" -r`
package="$name-$version.vsix"

BUCKET=org-dendron-public-assets
aws s3 cp $package s3://$BUCKET/publish/$package --acl public-read
echo https://$BUCKET.s3.amazonaws.com/publish/$package
