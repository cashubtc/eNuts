#!/bin/bash

### this script should create a new detach-signed *.apk.sig file,
### update the hash_list and finally delete the *.apk provided for the related filename

# 1. add the new apk build to the folder "utils/verification"
# 2. run the script from the root directory: utils/release.sh

# check if the verification directory exists
verification_dir="utils/verification"
if [ ! -d "$verification_dir" ]; then
  echo "Verification directory not found."
  exit 1
fi
# find the latest APK file in the verification directory
latest_apk=$(find "$verification_dir" -type f -name "*.apk" -exec ls -t {} + | head -n 1)
echo "latest_apk: $latest_apk"
# check if the latest APK file exists
if [ -z "$latest_apk" ]; then
  echo "No APK file found in the verification directory."
  exit 1
fi
# get the filename without the path
apk_filename=$(basename "$latest_apk")
echo "apk filename: $apk_filename"
# calculate the checksum of the APK file
apk_checksum=$(sha256sum "$latest_apk" | awk '{ print $1 }')
# add new APK file checksum to hash_list.txt
echo "$apk_checksum $apk_filename" >> "$verification_dir/hash_list.txt"
# generate detached signature for the new APK file
gpg --output "$latest_apk".sig --detach-sig --yes "$latest_apk"
# Update detached signature for hash_list.txt
gpg --armor --detach-sign --yes utils/verification/hash_list.txt
# delete the used APK file
rm "$latest_apk"
echo "Successfully updated the verification files."