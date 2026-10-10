#!/bin/sh
# BE 스키마 재생성 → 타입 재생성. 로컬 컨테이너 우선, 없으면 CI가 퍼블리시한 schema 브랜치 사용.
# 사용: pnpm --filter @dailyfunding/api-client sync-schema
set -eu
cd "$(dirname "$0")/.."
if docker exec dailyfunding-be-api-1 python manage.py spectacular --file /tmp/schema.yaml 2>/dev/null; then
  docker cp dailyfunding-be-api-1:/tmp/schema.yaml schema.yaml
else
  curl -fsSL https://raw.githubusercontent.com/dailyfunding-clone/dailyfunding-be/schema/schema.yaml -o schema.yaml
fi
pnpm typegen
