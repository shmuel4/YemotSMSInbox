#!/bin/bash
#
# B.H.
#

script=`readlink -f $0`
dir=`dirname $script`
project=`basename $dir`
lower_project=$(echo "$project" | tr '[:upper:]' '[:lower:]')
cd $dir

# build Dockerfile
exec docker build -t $lower_project .
