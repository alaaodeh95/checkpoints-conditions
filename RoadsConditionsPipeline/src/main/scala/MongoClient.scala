package org.aladdin.roadsconditions

import com.mongodb.client.{MongoClient, MongoClients, MongoCollection, MongoDatabase}
import org.bson.Document

object MongoClient {
  val client: MongoClient = MongoClients.create("mongodb://localhost:27017")
  val database: MongoDatabase = client.getDatabase("RoadsConditions")

  def getCollection(collectionName: String): MongoCollection[Document] = {
    database.getCollection(collectionName)
  }

  sys.addShutdownHook {
    client.close()
  }
}
