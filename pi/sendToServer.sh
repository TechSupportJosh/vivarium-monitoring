#!/bin/bash

# $2 = sensor name
# $3 = temperature
# $4 = humidity
# $6 = date

curl --header "Content-Type: application/json" \
  --header "x-api-key: REPLACEME" \
  --request POST \
  --data "{\"sensor\":\"$2\",\"humidity\":$4, \"temperature\":$3, \"date\": $6}" \
  http://localhost:9000/data
