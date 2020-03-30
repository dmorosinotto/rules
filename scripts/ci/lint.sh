#!/usr/bin/env bash

set -u -e
args=("$@")


if [[ ${TRAVIS_TEST_RESULT=0} == 1 ]]; then
  exit 1;
fi

ng lint rules
ng lint material-rules
ng lint fiori-rules

ng lint doc-app
ng lint material-app
ng lint fiori-app
