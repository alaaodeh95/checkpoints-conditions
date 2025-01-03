package org.aladdin.roadsconditions

import com.mongodb.client.model.{Filters, UpdateOptions}
import org.apache.spark.sql.functions.{col, lit}
import org.apache.spark.sql.streaming.{StreamingQuery, Trigger}
import org.apache.spark.sql.{DataFrame, SparkSession}
import org.bson.Document

object Utils {
  // Kafka source
  private val kafkaBootstrapServers = "localhost:9092"

  def createSparkSession (appName: String, checkpointDir: String): SparkSession = {
    val spark = SparkSession
      .builder()
      .appName(appName)
      .master("local[3]")
      .config("spark.executor.memory", "4g")
      .config("spark.sql.shuffle.partitions", "4")
      .config("fs.defaultFS", "file:///")
      .config("spark.sql.streaming.checkpointLocation", s"file://$checkpointDir")
      .getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")
    spark
  }

  private def mongoWriteConfig: String => Map[String, String] = (collection: String) => Map(
    "uri" -> f"mongodb://localhost:27017/RoadsConditions.${collection}",
    "database" -> "RoadsConditions",
    "collection" -> collection,
    "replaceDocument" -> "false"
  )

  def readStream: (SparkSession, String) => DataFrame = (spark: SparkSession, topicName: String) => spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", kafkaBootstrapServers)
    .option("subscribe", topicName)
    .option("startingOffsets", "latest")
    .load()

  def appendStreamToMongo(df: DataFrame, streamName: String): StreamingQuery = {
    df.writeStream
      .format("mongodb")
      .options(mongoWriteConfig(streamName))
      .outputMode("append")
      .trigger(Trigger.ProcessingTime("2 seconds"))
      .start()
  }

  def writeAggStreamToMongo(df: DataFrame, streamName: String, outputMode: String, aggInMinutes: Int): StreamingQuery = {
    df.writeStream
      .foreachBatch { (batchDF: DataFrame, _: Long) =>
        val mongoCollection = MongoClient.getCollection(streamName)
        batchDF
          .withColumn("startTime", col("window.start"))
          .drop("window")
          .withColumn("AggUnitInMinutes", lit(aggInMinutes))
          .collect()
          .foreach { row =>
            val doc = new Document()
            row.schema.fields.foreach { field =>
              doc.append(field.name, row.getAs[Any](field.name))
            }
            if (outputMode == "append") {
              mongoCollection.insertOne(doc)
            } else if (outputMode == "update") {
              val docId = doc.getString("_id")
              val filter = Filters.eq("_id", docId)
              val update = new Document("$set", doc)
              mongoCollection.updateOne(filter, update, new UpdateOptions().upsert(true))
            }
          }
      }
      .outputMode(outputMode)
      .trigger(Trigger.ProcessingTime("2 seconds"))
      .start()
  }

  def getWindowDuration(minutes: Int): String = {
    val hours = minutes / 60
    val mins = minutes % 60
    (hours, mins) match {
      case (0, m) => s"${m} minutes"
      case (1, 0) => "1 hour"
      case (h, 0) => s"${h} hours"
      case (1, m) => s"1 hour ${m} minutes"
      case (h, m) => s"${h} hours ${m} minutes"
    }
  }
}
