
all: css start

start:
	node bin/greenskin

css:
	mkdir -p public/style
	postcss --use postcss-import --use precss lib/assets/dashboard.css > public/style/dashboard.css
	postcss --use postcss-import --use precss lib/assets/app.css > public/style/app.css
