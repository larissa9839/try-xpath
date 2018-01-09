# FIREFOX=
# PROJ_DIR=
ZIP=/usr/bin/zip
RM=/usr/bin/rm
XPI_FILE=tryXpath.xpi

firefox-unit-test :
	"${FIREFOX}" "file://${PROJ_DIR}/test/unit_test/jasmine/SpecRunner.html" &

make_xpi :
	${RM} -f xpis/${XPI_FILE}
	cd tryXpath; ${ZIP} -r ../xpis/${XPI_FILE} *
