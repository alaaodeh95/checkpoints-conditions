package org.aladdin.roadsconditions

import com.mongodb.client.{MongoClient, MongoClients, MongoCollection, MongoDatabase}
import org.bson.Document

object MongoClient {
  val ConnectionString = "mongodb+srv://alaaodeh:Cersi1995%3F@roads-db.ddnkb.mongodb.net/?retryWrites=true&w=majority&appName=roads-db";
  val client: MongoClient = MongoClients.create(ConnectionString)
  val database: MongoDatabase = client.getDatabase("RoadsConditions")

  def getCollection(collectionName: String): MongoCollection[Document] = {
    database.getCollection(collectionName)
  }

  sys.addShutdownHook {
    client.close()
  }
}
