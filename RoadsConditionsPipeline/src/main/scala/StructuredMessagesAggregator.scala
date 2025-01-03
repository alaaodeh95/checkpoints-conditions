package org.aladdin.roadsconditions

import Models._
import Utils._

import org.apache.spark.sql.functions.{col, from_json}

object StructuredMessagesAggregator {
  def main(args: Array[String]): Unit = {
    val appName = "StructuredMessagesAggregator"
    val spark = createSparkSession(appName, args(0))
    val aggregators = new Aggregators(spark)

    val inputDF = readStream(spark, "road-structured-messages")
      .selectExpr("CAST(value AS STRING) as json_str")
      .select(from_json(col("json_str"), roadMessageStructuredSchema).as("data"))
      .select("data.*")

    // Write streams
    writeAggStreamToMongo(aggregators.countAggregations(inputDF, getWindowDuration(60)), "AggregationCount", "update", 60)
    writeAggStreamToMongo(aggregators.aggCheckpoints(inputDF, getWindowDuration(60)), "CheckpointAggregation", "update", 60)

    spark.streams.awaitAnyTermination()
  }
}
