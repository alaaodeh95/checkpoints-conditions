package org.aladdin.roadsconditions

// Internal
import RowDataTransformationUtils._
import Models._
import Utils._

import org.apache.spark.sql.functions._
import org.apache.spark.sql.streaming.Trigger

object RawRoadMessagesConsumer {
  def main(args: Array[String]): Unit = {
    val appName = "RoadRowDataConsumer"
    val bloomFilter = new BloomFilterMessagesIds(args(0))
    val spark = createSparkSession(appName, args(1))
    import spark.implicits._

    // Read from Kafka in streaming mode
    val kafkaDF = readStream(spark, "road-raw-messages")

    val inputDF = kafkaDF.selectExpr("CAST(value AS STRING) as json_str")
      .withColumn("json_str", regexp_replace($"json_str", "'", "\""))
      .withColumn("json_str", regexp_replace($"json_str", "\": False", "\": false"))
      .withColumn("json_str", regexp_replace($"json_str", "\": True", "\": true"))
      .select(from_json($"json_str", roadMessageSchema).as("data"))
      .select("data.*")
      .na.drop()

    // Data extraction
    val transformedDF = inputDF
      .filter(bloomFilterUDF(bloomFilter)($"messageId"))
      .withColumn("sentences", splitSentencesUDF($"text", $"isReply"))
      .selectExpr("*", "posexplode(sentences) as (pos, sentence)")
      .withColumn("_id", concat($"messageId", lit("-"), $"pos"))
      .withColumn("shouldProcess", shouldProcessUDF($"sentence", $"isReply"))
      .filter($"shouldProcess" === true)
      .withColumn("checkpoint", addLocationUDF($"sentence"))
      .filter($"checkpoint" =!= "None")
      .withColumn("city", addCityUDF($"checkpoint"))
      .withColumn("status", extractStatusUDF($"sentence"))
      .filter($"status" =!= "None")
      .withColumn("direction", extractDirectionUDF($"sentence"))
      .drop("messageId", "sentence","isReply","shouldProcess", "pos", "sentences", "text")

    // Write to mongo
    writeStreamToMongo(transformedDF, "StructuredData", "append", 0)

    // Push to kafka
     transformedDF
      .selectExpr("to_json(struct(*)) AS value") // Convert entire row to JSON string
      .writeStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "localhost:9092")
      .option("topic", "road-structured-messages")
      .outputMode("append")
      .trigger(Trigger.ProcessingTime("2 seconds"))
      .start()

    spark.streams.awaitAnyTermination()
  }
}
