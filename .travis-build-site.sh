#!/bin/bash
#
# This is a flat build script that manages everything we want to
# see on the github pages. Simply all build_ functions get called.
#
GENERATE="./generate.py -sI"
TARGET="$PWD/build"

function build_website_api {
  echo "Building website API..."
  (
    cd component/standalone/website
    grunt api && cp -a api "$TARGET/website-api"
  )
}

function build_mobile_showcase {
  echo "Building mobile showcase..."
  (
    cd application/mobileshowcase
    $GENERATE build && cp -a build "$TARGET/mobileshowcase"
  )
}

function build_tutorial {
  echo "Building tutorial..."
  (
    cd application/tutorial
    $GENERATE build && cp -a build "$TARGET/tutorial"
  )
}

function build_website_widgetbrowser {
  echo "Building website widget browser..."
  (
    cd application/websitewidgetbrowser
    grunt build && cp -a build "$TARGET/websitewidgetbrowser"
  )
}

function build_feedreader {
  echo "Building feedreader..."
  (
    cd application/feedreader
    $GENERATE build && cp -a build "$TARGET/feedreader"
    $GENERATE build-mobile && cp -a build-mobile "$TARGET/feedreader-mobile"
    $GENERATE build-website && cp -a build-website "$TARGET/feedreader-website"
  )
}

function build_api {
  echo "Building framework API..."
  (
    cd framework
    $GENERATE api && cp -a api "$TARGET"
  )
}

function build_playground {
  echo "Building playground..."
  (
    cd application/playground
    $GENERATE build && cp -a build "$TARGET/playground"
  )
}

function build_demobrowser {
  echo "Building demobrowser..."
  (
    cd application/demobrowser
    $GENERATE build && cp -a build "$TARGET/demobrowser"
  )
}

function build_showcase {
  echo "Building showcase..."
  (
    cd application/showcase
    $GENERATE build && cp -a build "$TARGET/showcase"
  )
}

function build_widgetbrowser {
  echo "Building widgetbrowser..."
  (
    cd application/widgetbrowser
    $GENERATE build && cp -a build "$TARGET/widgetbrowser"
  )
}

function build_manual {
  echo "Building manual..."
  (
    cd documentation/manual
    make html && cp -a build/html "$TARGET"
    make latexpdf && cp -a build/latex/qooxdoo.pdf "$TARGET"
    make epub && cp -a build/epub/qooxdoo.epub "$TARGET"
  )
}

npm install
grunt setup

[ -d "$TARGET" ] && rm -rf "$TARGET"
mkdir -p "$TARGET"

# Run all build_ methods in background
for build in $(declare -f | sed -n "s/^\(build_[^ ]*\).*) *$/\1/p"); do
  $build &
done
wait
