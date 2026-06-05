#!/bin/sh
set -e

echo "Running database migrations..."
npx --yes prisma@6.11.1 db push --skip-generate

echo "Starting application..."
exec "$@"
