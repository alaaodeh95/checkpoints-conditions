package org.aladdin.roadsconditions

object MainDispatcher {
  def main(args: Array[String]): Unit = {
    args.headOption match {
      case Some("RawRoadMessagesConsumer") =>
        RawRoadMessagesConsumer.main(args.tail)
      case Some("StructuredMessagesAggregator") =>
        StructuredMessagesAggregator.main(args.tail)
      case _ =>
        println("Specify a valid main class name as the first argument!")
    }
  }
}
