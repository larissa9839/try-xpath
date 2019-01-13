# FIREFOX=
# PROJ_DIR=
ZIP=/usr/bin/zip
RM=/usr/bin/rm
XPI_FILE=tryXpath.xpi

make_xpi :
	${RM} -f xpis/${XPI_FILE}
	cd tryXpath; ${ZIP} -r ../xpis/${XPI_FILE} *
