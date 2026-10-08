.PHONY: install dev build start up down clean

# Install dependencies
install:
	npm install

# Run the development server (foreground)
dev:
	npm run dev

# Build the application for production
build:
	npm run build

# Start the production server (foreground)
start:
	npm run start

# Run the application in the background and save the PID
up:
	@echo "Starting Next.js application..."
	@npm run dev > next-app.log 2>&1 & echo $$! > .app.pid
	@echo "Application started in background (PID: $$(cat .app.pid)). Logs at next-app.log"

# Turn the application down
down:
	@if [ -f .app.pid ]; then \
		echo "Turning down application (PID: $$(cat .app.pid))..."; \
		kill $$(cat .app.pid) 2>/dev/null || true; \
		rm -f .app.pid; \
		echo "Application stopped."; \
	else \
		echo "No running application found (.app.pid is missing)."; \
	fi

# Clean up build artifacts and logs
clean:
	rm -rf .next next-app.log .app.pid

