#!/usr/bin/env bash
export version=$(grep '"version"' package.json | sed 's/"version":[[:space:]]*"//' | sed 's/",//' | tr -d [:space:])
curl -sSfL https://github.com/getgauge/gauge/raw/master/build/github_release.sh | sh