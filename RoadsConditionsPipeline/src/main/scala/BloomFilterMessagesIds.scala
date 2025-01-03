package org.aladdin.roadsconditions

import java.io._

class BloomFilterMessagesIds(filePath: String, size: Int = 10000, hashCount: Int = 3) extends Serializable {
  private val bitArray: Array[Boolean] = new Array[Boolean](size)

  load()

  private def hash(item: String, seed: Int): Int = {
    Math.abs((item.hashCode ^ seed) % size)
  }

  def add(item: String): Unit = {
    (1 to hashCount).foreach { i =>
      bitArray(hash(item, i)) = true
    }
  }

  def mightContain(item: String): Boolean = {
    (1 to hashCount).forall { i =>
      bitArray(hash(item, i))
    }
  }

  private def save(): Unit = {
    try {
      val file = new File(filePath)
      val outputStream = new ObjectOutputStream(new FileOutputStream(file))
      outputStream.writeObject(this)
      outputStream.close()
      println(s"Bloom Filter saved to $filePath.")
    } catch {
      case e: IOException => println(s"Error saving Bloom Filter: ${e.getMessage}")
    }
  }

  private def load(): Unit = {
    val file = new File(filePath)
    if (file.exists()) {
      try {
        val inputStream = new ObjectInputStream(new FileInputStream(file))
        val loadedFilter = inputStream.readObject().asInstanceOf[BloomFilterMessagesIds]
        System.arraycopy(loadedFilter.bitArray, 0, this.bitArray, 0, size)
        inputStream.close()
        println(s"Bloom Filter loaded from $filePath.")
      } catch {
        case e: IOException => println(s"Error loading Bloom Filter: ${e.getMessage}")
        case e: ClassNotFoundException => println(s"Error: Bloom Filter class not found.")
      }
    } else {
      println("No existing Bloom Filter found. Initializing a new one.")
    }
  }

  // Auto-save on shutdown
  sys.addShutdownHook {
    println("Shutdown hook triggered. Saving Bloom Filter...")
    save()
  }
}
