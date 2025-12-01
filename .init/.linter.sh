#!/bin/bash
cd /home/kavia/workspace/code-generation/delivery-tracker-pro-215648-215659/frontend_web
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

