#!/bin/sh
# The above line tells the system to execute this script with the Bourne shell.

# Exit immediately if a command exits with a non-zero status.
# This ensures that if the migration fails, the script stops and
# the container won't start the application with a broken database schema.
set -e

# Log that migrations are starting.
echo "Running database migrations..."

# Run the migration command defined in your package.json.
npm run migrate:up

# Log that migrations are complete.
echo "Migrations complete. Starting server..."

# This is the crucial part. 'exec "$@"' replaces the shell script
# with the command that was passed as arguments to the script.
# In our Dockerfile, this will be `node dist/index.js`.
# This ensures the Node server becomes the main process (PID 1)
# in the container, which is important for receiving signals like shutdown commands.
exec "$@"