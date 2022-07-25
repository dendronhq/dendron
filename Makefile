clean:
	echo "Cleaning project"
	./bootstrap/scripts/cleanup.sh

install: 
	echo "Installing yarn dependencies..."
	yarn
	echo "Installing package dependencies..."
	yarn setup

watch: 
	echo "Watching for changes..."
	./bootstrap/scripts/watch.sh

cleanBuild:
	echo "Clean building..."
	make clean
	make install
