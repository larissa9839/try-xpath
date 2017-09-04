# FIREFOX=
# PROJ_DIR=
ZIP=/usr/bin/zip

firefox-unit-test :
	"${FIREFOX}" "file://${PROJ_DIR}/test/unit_test/jasmine/SpecRunner.html" &

make_xpi :
	cd tryXpath; ${ZIP} -r ../xpis/tryXpath.xpi *
