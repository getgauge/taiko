#!/bin/bash

if [ -z "$GITHUB_TOKEN" ]; then
    echo "GITHUB_TOKEN is not set."
    echo "Please create an personal access token with repo:public_repo scopes."
    exit 1
fi

curl \
    -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.ant-man-preview+json" \
    -H "Content-Type: application/json" \
    https://api.github.com/repos/getgauge/taiko/deployments \
    --data '{"ref": "master", "required_contexts": [], "environment": "production"}'