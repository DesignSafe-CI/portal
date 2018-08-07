npm install --save-dev elasticdump
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/cms \
  --output=http://localhost:9200/cms \
  --type=analyzer
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/cms \
  --output=http://localhost:9200/cms \
  --type=mapping
 
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/cms \
  --output=http://localhost:9200/cms \
  --type=alias
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/cms \
  --output=http://localhost:9200/cms \
  --type=data \
  --limit=1000 --quiet
    
 echo "CMS transfer complete"
  
  
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications \
  --output=http://localhost:9200/des-publications_a \
  --type=analyzer
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications \
  --output=http://localhost:9200/des-publications_a \
  --type=mapping
 
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications \
  --output=http://localhost:9200/des-publications_a \
  --type=alias
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications \
  --output=http://localhost:9200/des-publications_a \
  --type=data \
  --limit=1000 --quiet
  
  
 echo "des-publications transfer complete"
   
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications_legacy \
  --output=http://localhost:9200/des-publications_legacy_a \
  --type=analyzer
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications_legacy \
  --output=http://localhost:9200/des-publications_legacy_a \
  --type=mapping
 
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications_legacy \
  --output=http://localhost:9200/des-publications_legacy_a \
  --type=alias
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-publications_legacy \
  --output=http://localhost:9200/des-publications_legacy_a \
  --type=data \
  --limit=1000 --quiet
  
 echo "des-publications_legacy transfer complete"
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-rapid_nh \
  --output=http://localhost:9200/des-rapid_nh_a \
  --type=analyzer
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-rapid_nh \
  --output=http://localhost:9200/des-rapid_nh_a \
  --type=mapping
 
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-rapid_nh \
  --output=http://localhost:9200/des-rapid_nh_a \
  --type=alias
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-rapid_nh \
  --output=http://localhost:9200/des-rapid_nh_a \
  --type=data \
  --limit=1000 --quiet
  
  
 echo "des-rapid_nh transfer complete"
  
 ./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-files \
  --output=http://localhost:9200/des-files_a \
  --type=analyzer
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-files \
  --output=http://localhost:9200/des-files_a \
  --type=mapping
 
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-files \
  --output=http://localhost:9200/des-files_a \
  --type=alias
  
./node_modules/.bin/elasticdump \
  --input=http://designsafe-es01.tacc.utexas.edu:9200/des-files \
  --output=http://localhost:9200/des-files_a \
  --type=data \
  --size=100000 \
  --limit=1000 \
  --searchBody='{ "query": {
      "function_score": {
          "query": { "match_all": {} },
          "functions": [{ "random_score": {"seed": "tacc rulz ok"} }]
          }}}'
  
echo "transferred random sample of 100000 documents from des-files."
