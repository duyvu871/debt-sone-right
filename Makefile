# debt_done_right — shortcuts (cần Node >=22, npm).
# Xem: make help

.DEFAULT_GOAL := help

NPM := npm

.PHONY: help
help: ## Liệt kê các lệnh
	@echo "Targets:"
	@grep -E '^[a-zA-Z0-9_.-]+:.*##' $(MAKEFILE_LIST) | sort | sed 's/:\\(.*\\)##/ — /'

.PHONY: install
install: ## Cài dependency
	$(NPM) install

.PHONY: env
env: ## Tạo .env từ env.example nếu chưa có
	@test -f .env || cp env.example .env
	@echo "OK (.env đã tồn tại hoặc vừa tạo từ env.example)"

.PHONY: dev
dev: ## Chạy Next dev
	$(NPM) run dev

.PHONY: build
build: ## next build
	$(NPM) run build

.PHONY: start
start: ## next start (production)
	$(NPM) run start

.PHONY: typecheck
typecheck: ## tsc
	$(NPM) run typecheck

.PHONY: lint
lint: ## biome check
	$(NPM) run lint

.PHONY: format
format: ## biome format --write
	$(NPM) run format

.PHONY: prisma-generate
prisma-generate: ## prisma generate
	$(NPM) run prisma:generate

.PHONY: prisma-migrate-dev
prisma-migrate-dev: ## prisma migrate dev
	$(NPM) run prisma:migrate:dev

.PHONY: prisma-migrate-deploy
prisma-migrate-deploy: ## prisma migrate deploy
	$(NPM) run prisma:migrate:deploy

.PHONY: prisma-seed
prisma-seed: ## prisma db seed
	npx prisma db seed

.PHONY: prisma-studio
prisma-studio: ## prisma studio
	$(NPM) run prisma:studio

.PHONY: docker-up
docker-up: ## docker compose up -d (Postgres)
	$(NPM) run docker:up

.PHONY: docker-down
docker-down: ## docker compose down
	$(NPM) run docker:down

.PHONY: docker-logs
docker-logs: ## docker compose logs -f postgres
	$(NPM) run docker:logs

.PHONY: pm2-start
pm2-start: ## pm2 start (cần build trước)
	$(NPM) run pm2:start

.PHONY: pm2-reload
pm2-reload: ## pm2 reload
	$(NPM) run pm2:reload

.PHONY: pm2-stop
pm2-stop: ## pm2 stop
	$(NPM) run pm2:stop

.PHONY: check-layering
check-layering: ## Kiểm tra import layers
	$(NPM) run check:layering

# Khởi tạo DB local: docker + migrate + seed
.PHONY: db-bootstrap
db-bootstrap: docker-up prisma-migrate-deploy prisma-seed ## Up Postgres, migrate deploy, seed

# Chuỗi dev: env + install + generate (DB do bạn tự docker-up hoặc URL có sẵn)
.PHONY: setup
setup: env install prisma-generate ## env mẫu + npm i + prisma generate
