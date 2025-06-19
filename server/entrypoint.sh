#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

# This is the crucial part. 'exec "$@"' replaces the shell script
# with the command that was passed as arguments to the script
# (e.g., `node dist/index.js`). This ensures the Node server
# becomes the main process (PID 1) in the container.
echo "Starting server..."
exec "$@"