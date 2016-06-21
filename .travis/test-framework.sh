#!/bin/bash
set -v

if [ "$QXBROWSER" = "" ]; then
    exit 0
fi

if [ "${QXBROWSER}" = "Firefox" ] && [ "${QXVERSION}" = "latest" ]; then
    npm run-script travis-coverage
    RES=$?

    echo "Running lint..."
    ./generate.py -sI lint 2>&1 | grep 'Error:\|Warning:'
    if [ $? -eq 0 ]; then
        echo "Lint warnings are treated as errors! Please fix!"
        exit 1
    fi

    echo "Checking API..."
    ./generate.py -sI api 2>&1 | grep 'Error:\|Warning:'
    if [ $? -eq 0 ]; then
        echo "Documentation warnings are treated as errors! Please fix!"
        exit 1
    fi

    echo "Checking tests..."
    ./generate.py -sI test-source 2>&1 | grep 'Error:\|Warning:'
    if [ $? -eq 0 ]; then
        echo "Lint warnings are treated as errors! Please fix!"
        exit 1
    fi

    exit $RES
fi

npm run-script travis-test
exit $?
