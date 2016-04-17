
all: css start

start:
	node bin/greenskin

css:
	mkdir -p lib/app/public/styles
	postcss --use postcss-import --use precss -o lib/app/public/styles/dashboard.css lib/app/assets/dashboard.css
	postcss --use postcss-import --use precss -o lib/app/public/styles/app.css lib/app/assets/app.css
