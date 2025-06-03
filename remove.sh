#!/bin/bash
#
# B.H.
#

script=`readlink -f $0`
dir=`dirname $script`
project=`basename $dir`
lower_project=$(echo "$project" | tr '[:upper:]' '[:lower:]')
cd $dir

docker stop $lower_project --time 60
docker rm $lower_project

