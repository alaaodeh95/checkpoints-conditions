ThisBuild / version := "0.1.0-SNAPSHOT"

ThisBuild / scalaVersion := "2.12.20"

lazy val root = (project in file("."))
  .settings(
    name := "RoadsConditions",
    idePackagePrefix := Some("org.aladdin.roadsconditions")
  )

Compile / assembly / mainClass := Some("org.aladdin.roadsconditions.MainDispatcher")

libraryDependencies ++= Seq(
  // apache Spark Core
  "org.apache.spark" %% "spark-core" % "3.5.4",

  // apache Spark SQL (required for Structured Streaming)
  "org.apache.spark" %% "spark-sql" % "3.5.4",

  // spark Structured Streaming Kafka Integration
  "org.apache.spark" %% "spark-sql-kafka-0-10" % "3.5.4",

  // apache Kafka Clients
  "org.apache.kafka" % "kafka-clients" % "3.9.0",

  // mongo
  "org.mongodb.spark" %% "mongo-spark-connector" % "10.4.0",

  // used by kafka and spark
  "com.github.luben" % "zstd-jni" % "1.5.6-9"
)

import sbtassembly.{MergeStrategy, PathList}

assembly / assemblyMergeStrategy := {
  case PathList("META-INF", "io.netty.versions.properties") => MergeStrategy.first
  case PathList("META-INF", "native-image", _*)             => MergeStrategy.discard
  case PathList("META-INF", "services", _*)                 => MergeStrategy.concat
  case PathList("META-INF", _*)                             => MergeStrategy.discard
  case "arrow-git.properties"                               => MergeStrategy.first
  case PathList("google", "protobuf", _*)                   => MergeStrategy.first
  case "module-info.class"                                  => MergeStrategy.discard
  case PathList("META-INF", "versions", _*)                 => MergeStrategy.discard
  case "META-INF/org/apache/logging/log4j/core/config/plugins/Log4j2Plugins.dat" => MergeStrategy.concat
  case PathList("META-INF", "native-image", "org.mongodb.bson", _*) => MergeStrategy.first
  case x if x.endsWith(".class")                            => MergeStrategy.last
  case x if x.contains("guava")                             => MergeStrategy.last
  case x => MergeStrategy.defaultMergeStrategy(x)
}
