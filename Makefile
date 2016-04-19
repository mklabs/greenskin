files = "lib/app/assets**/*.css lib/app/views/**/*.hbs lib/app/public/dashboard/**/*"

changed="material.css"

css:
	mkdir -p lib/app/public/styles
	postcss -c ./.postcssrc.json lib/app/assets/material.css -o lib/app/public/styles/material.css

notify:
	curl http://localhost:35729/changed?files=$changed

start:
	[ -e tiny-lr.pid ] || tiny-lr &
	babel-node bin/greenskin

echo:
	echo $files

watch:
	watchd $files -c 'bake css notify' &

all: watch start
