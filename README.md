
# wa-platform (gateway + orchestrator)

모노리포 구조로 게이트웨이와 오케스트레이터를 분리하고, DB/설정/로거/타입 등은 공용 패키지로 관리한다.
패키지 매니저는 pnpm 기준(일반 npm/yarn도 가능).

## 빠른 시작
```bash
pnpm i
cp .env.example .env
docker compose up -d db
pnpm -w prisma:generate && pnpm -w prisma:migrate
pnpm -w dev
```
