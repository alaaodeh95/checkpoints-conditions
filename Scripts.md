# Run 
./kafka-topics.sh --create --topic road-raw-messages --bootstrap-server localhost:9092 --partitions 4 
./kafka-topics.sh --create --topic road-structured-messages --bootstrap-server localhost:9092 --partitions 4

spark-submit --class org.aladdin.roadsconditions.MainDispatcher \
  --master "local[3]" \
  --deploy-mode client \
  --conf spark.executor.memory=4g \
  --conf spark.executor.cores=3 \
  --conf spark.executor.extraClassPath=/path/to/your/guava-16.0.1.jar \
  --conf spark.driver.extraClassPath=/path/to/your/guava-16.0.1.jar \
  /Users/alaaodeh/Desktop/Projects/big\ data/RoadsConditions/target/scala-2.12/RoadsConditions.jar \
  RawRoadMessagesConsumer \
  /Users/alaaodeh/Desktop/Projects/big\ data/RoadsConditions/filter.bloom \
  /Users/alaaodeh/Desktop/Projects/big\ data/RoadsConditions/checkpoints/RawRoadDataConsumer

spark-submit --class org.aladdin.roadsconditions.MainDispatcher \
  --master "local[3]" \
  --deploy-mode client \
  --conf spark.executor.memory=4g \
  --conf spark.executor.cores=3 \
  /Users/alaaodeh/Desktop/Projects/big\ data/RoadsConditions/target/scala-2.12/RoadsConditions.jar \
  StructuredMessagesAggregator \
  /Users/alaaodeh/Desktop/Projects/big\ data/RoadsConditions/checkpoints/StructuredMessagesAggregator

curl -X POST "http://127.0.0.1:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
           "checkpoint": "checkpoint_عورتا",
           "day_of_week": "Sunday",
           "hour": 8
         }'
