#!/bin/bash

API_KEY="videochat_default_secret"
 VIDEOCHAT_URL="http://localhost:3000/api/v1/meeting"
# VIDEOCHAT_URL=https://videolify.herokuapp.com/api/v1/meeting
#VIDEOCHAT_URL=/api/v1/meeting

curl $VIDEOCHAT_URL \
    --header "authorization: $API_KEY" \
    --header "Content-Type: application/json" \
    --request POST