package org.aladdin.roadsconditions

import Models._

import org.apache.spark.sql.functions._
import org.apache.spark.sql.{Column, DataFrame, RelationalGroupedDataset, SparkSession}

class Aggregators(spark: SparkSession) {
  import spark.implicits._

  private def aggregateStream(df: DataFrame, aggFunc: RelationalGroupedDataset => DataFrame, aggColumns: Seq[Column], idColumn: Column): DataFrame = {
    aggFunc(df.withWatermark("sentTime", "10 seconds").groupBy(aggColumns: _*))
      .withColumn("_id", idColumn)
  }

  def countAggregations(df: DataFrame, windowDuration: String): DataFrame = {
    aggregateStream(
      df,
      df =>  {
        // Base aggregations
        val baseAgg = Seq(
          count("*").alias("count"),
          sum(when($"isAdmin" === true, 1).otherwise(0)).alias("admin_count")
        )

        // Dynamic aggregations for each category
        val checkpointAgg = Checkpoints.keys.map(key =>
          sum(when($"checkpoint" === key, 1).otherwise(0)).alias(f"checkpoint_${key}_count")
        )

        val cityAgg = cityCheckpointMapping.keys.map(key =>
          sum(when($"city" === key, 1).otherwise(0)).alias(f"city_${key}_count")
        )

        val statusAgg = CheckpointState.keys.map(key =>
          sum(when($"status" === key, 1).otherwise(0)).alias(f"status_${key}_count")
        )

        val directionAgg = CheckpointDirection.keys.map(key =>
          sum(when($"direction" === key, 1).otherwise(0)).alias(f"direction_${key}_count")
        )

        val groupsAggs = groups.map(key =>
          sum(when($"group" === key, 1).otherwise(0)).alias(f"group_${key}_count")
        )

        val allAggs = baseAgg ++ checkpointAgg ++ cityAgg ++ statusAgg ++ directionAgg ++ groupsAggs
        df.agg(allAggs.head, allAggs.tail: _*)
      },
      Seq(window($"sentTime", windowDuration)),
      concat_ws("_", date_format(col("window.start"), "yyyy-MM-dd'T'HH:mm:ss'Z'"), lit(windowDuration)))
  }

  def aggCheckpoints(df: DataFrame, windowDuration: String): DataFrame = {
    aggregateStream(
      df,
      df => {
        val enter = $"direction" === "الاتجاهين" || $"direction" === "داخل"
        val exist = $"direction" === "الاتجاهين" || $"direction" === "خارج"
        val closed = $"status" === "مغلق"
        val traffic = $"status".contains("ازمة")
        val open = $"status" === "مفتوح" || $"status" === "حاجز"

        val lastEnterState = when(enter && closed, "Closed_Enter")
          .when(enter && traffic, "Traffic_Enter")
          .when(enter && open, "Open_Enter")

        val lastExitState = when(exist && closed, "Closed_Exit")
          .when(exist && traffic, "Traffic_Exit")
          .when(exist && open, "Open_Exit")

        df.agg(
          count("*").alias("total_count"),
          first($"city").alias("city"),
          sum(when($"isAdmin" === true, 1).otherwise(0)).alias("admin_count"),
          sum(when(enter && closed, 1).otherwise(0)).alias("Closed_Enter"),
          sum(when(enter && traffic, 1).otherwise(0)).alias("Traffic_Enter"),
          sum(when(enter && open, 1).otherwise(0)).alias("Open_Enter"),
          sum(when(exist && closed, 1).otherwise(0)).alias("Closed_Exit"),
          sum(when(exist && traffic, 1).otherwise(0)).alias("Traffic_Exit"),
          sum(when(exist && open, 1).otherwise(0)).alias("Open_Exit"),
          last(lastEnterState, ignoreNulls = true).alias("Last_Enter_State"),
          last(lastExitState, ignoreNulls = true).alias("Last_Exit_State")
        )
      },
      Seq(window($"sentTime", windowDuration), col("checkpoint")),
      concat_ws("_", date_format(col("window.start"), "yyyy-MM-dd'T'HH:mm:ss'Z'"), lit(windowDuration), col("checkpoint")))
  }
}
