package org.aladdin.roadsconditions

import Models._

import org.apache.spark.sql.expressions.UserDefinedFunction
import org.apache.spark.sql.functions.udf

object RowDataTransformationUtils {
  val pattern = "(?<=\\p{So}|[.!?,\n])(?=\\s|$)|(?<=[.!?,\n])"

  private val questionIndicators = List("?","كيف", "وين" ,"مين افضل" ,"شو" ,"سمحتو","وضع")

  def bloomFilterUDF(bloomFilter: BloomFilterMessagesIds): UserDefinedFunction = udf((messageId: String) => {
    if (bloomFilter.mightContain(messageId)) {
      false
    } else {
      bloomFilter.add(messageId)
      true
    }
  })

  def splitSentencesUDF: UserDefinedFunction = udf((text: String, isReply: Boolean) => {
    if (text == null || text.isEmpty) {
      Array.empty[String]
    }
    else if (isReply) {
      Array(text)
    }
    else {
      text.split(pattern).map(_.trim).filter(_.nonEmpty)
    }
  })

  def shouldProcessUDF: UserDefinedFunction = udf((sentence: String, isReply: Boolean) => {
    !questionIndicators.exists(sentence.contains) || isReply
  })

  def addLocationUDF: UserDefinedFunction = udf((text: String) => {
    Checkpoints.find(x => x._2.exists(text.contains)) match {
      case Some(value) => value._1
      case None        => "None"
    }
  })

  def addCityUDF: UserDefinedFunction = udf((checkpoint: String) => {
    cityCheckpointMapping.find(x => x._2.contains(checkpoint)) match {
      case Some(value) => value._1
      case None        => "None"
    }
  })

  def extractStatusUDF: UserDefinedFunction = udf((text: String) => {
    CheckpointState.find(x => x._2.exists(text.contains)) match {
      case Some(value) => value._1
      case None        => "None"
    }
  })

  def extractDirectionUDF: UserDefinedFunction = udf((text: String) => {
    CheckpointDirection.find(x => x._2.exists(text.contains)) match {
      case Some(value) => value._1
      case None        => "الاتجاهين"
    }
  })
}
