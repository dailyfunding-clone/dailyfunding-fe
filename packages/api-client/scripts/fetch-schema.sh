#!/bin/sh
# BE 스키마 재생성 → 타입 재생성. 컨테이너 실행 중이어야 함.
# 사용: pnpm --filter @dailyfunding/api-client sync-schema
set -eu
cd "$(dirname "$0")/.."
docker exec dailyfunding-be-api-1 python manage.py spectacular --file /tmp/schema.yaml
docker cp dailyfunding-be-api-1:/tmp/schema.yaml schema.yaml
pnpm typegen
