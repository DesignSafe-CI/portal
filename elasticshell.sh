./node_modules/.bin/elasticdump \--input=./des-files.analyzer \--output=http://localhost:9200/des-files \--type=analyzer

./node_modules/.bin/elasticdump \--input=./des-files.mapping \--output=http://localhost:9200/des-files \--type=mapping

./node_modules/.bin/elasticdump \--input=./des-files_dump.data \--output=http://localhost:9200/des-files \--type=data \--limit=1000

echo "loaded des-files" 

./node_modules/.bin/elasticdump \--input=./cms.analyzer \--output=http://localhost:9200/cms \--type=analyzer

./node_modules/.bin/elasticdump \--input=./cms.mapping \--output=http://localhost:9200/cms \--type=mapping

./node_modules/.bin/elasticdump \--input=./cms.data \--output=http://localhost:9200/cms \--type=data \--limit=1000

echo "loaded cms"

./node_modules/.bin/elasticdump \--input=./des-publications.analyzer \--output=http://localhost:9200/des-publications \--type=analyzer

./node_modules/.bin/elasticdump \--input=./des-publications.mapping \--output=http://localhost:9200/des-publications \--type=mapping

./node_modules/.bin/elasticdump \--input=./des-publications.data \--output=http://localhost:9200/des-publications \--type=data \--limit=1000

echo "loaded des-publications"

./node_modules/.bin/elasticdump \--input=./des-publications_legacy.analyzer \--output=http://localhost:9200/des-publications_legacy \--type=analyzer

./node_modules/.bin/elasticdump \--input=./des-publications_legacy.mapping \--output=http://localhost:9200/des-publications_legacy \--type=mapping

./node_modules/.bin/elasticdump \--input=./des-publications_legacy.data \--output=http://localhost:9200/des-publications_legacy \--type=data \--limit=1000

echo "loaded des-publications_legacy"