import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const MONGO_URI = "mongodb+srv://alaaodeh:Cersi1995%3F@roads-db.ddnkb.mongodb.net/?retryWrites=true&w=majority&appName=roads-db";
const DB_NAME = "RoadsConditions";
const CHECKPOINT_COLLECTION_NAME = "CheckpointAggregation";
const STRUCTURED_DATA_COLLECTION = "StructuredData";
app.use(cors());

const client = new MongoClient(MONGO_URI || "mongodb://localhost:27017");
await client.connect();
const db = client.db(DB_NAME);

const calculateTrend = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100; // no previous data means full increase
  return ((current - previous) / previous) * 100;
};

const fetchTimeSeries = async (city, from, to) => {
  const collection = db.collection(CHECKPOINT_COLLECTION_NAME);

  return await collection.aggregate([
    {
      $match: {
        city,
        startTime: { $gte: new Date(from), $lt: new Date(to) }
      }
    },
    {
      $group: {
        _id: {
          checkpoint: "$checkpoint",
          startTime: "$startTime"
        },
        lastEnterState: { $last: "$Last_Enter_State" },
        lastExitState: { $last: "$Last_Exit_State" }
      }
    },
    { $sort: { "_id.startTime": 1 } }
  ]).toArray();
};

const fetchAggregations = async (city, from, to) => {
  const collection = db.collection(CHECKPOINT_COLLECTION_NAME);

  return await collection.aggregate([
    {
      $match: {
        city,
        startTime: { $gte: new Date(from), $lt: new Date(to) }
      }
    },
    {
      $group: {
        _id: "$checkpoint",
        openEnter: { $sum: "$Open_Enter" },
        openExit: { $sum: "$Open_Exit" },
        closedEnter: { $sum: "$Closed_Enter" },
        closedExit: { $sum: "$Closed_Exit" },
        trafficEnter: { $sum: "$Traffic_Enter" },
        trafficExit: { $sum: "$Traffic_Exit" },
        totalEnter: { $sum: { $add: ["$Open_Enter", "$Closed_Enter", "$Traffic_Enter"] } },
        totalExit: { $sum: { $add: ["$Open_Exit", "$Closed_Exit", "$Traffic_Exit"] } },
        adminCount: { $sum: "$admin_count" }
      }
    }
  ]).toArray();
};

const fetchLastCheckpointData = async (city) => {
  const collection = db.collection(STRUCTURED_DATA_COLLECTION);

  const sixHoursAgo = new Date(Date.now() - 120 * 60 * 60 * 1000); // 12 hours back

  const data = await collection.aggregate([
    {
      $match: {
        city,
        sentTime: { $gte: sixHoursAgo } 
      }
    },
    {
      $sort: { sentTime: -1 }
    },
    {
      $group: {
        _id: "$checkpoint",
        lastStatus: { $first: "$status" },
        lastDirection: { $first: "$direction" },
        updateTime: { $first: "$sentTime" },
        fullHistory: { $push: { status: "$status", direction: "$direction", sentTime: "$sentTime" } }
      }
    }
  ]).toArray();

  const result = data.map((checkpoint) => {
    const { lastStatus, lastDirection, fullHistory } = checkpoint;

    let enterState = null;
    let exitState = null;
    let enterUpdateTime = null;
    let exitUpdateTime = null;

    if (lastDirection === "الاتجاهين") {
      enterState = lastStatus;
      exitState = lastStatus;
      enterUpdateTime = checkpoint.updateTime;
      exitUpdateTime = checkpoint.updateTime;
    } else if (lastDirection === "داخل") {
      enterState = lastStatus;
      enterUpdateTime = checkpoint.updateTime;

      const exitCandidate = fullHistory.find(
        (msg) => msg.direction === "الاتجاهين" || msg.direction === "خارج"
      );
      if (exitCandidate) {
        exitState = exitCandidate.status;
        exitUpdateTime = exitCandidate.sentTime;
      }
    } else if (lastDirection === "خارج") {
      exitState = lastStatus;
      exitUpdateTime = checkpoint.updateTime;

      const enterCandidate = fullHistory.find(
        (msg) => msg.direction === "الاتجاهين" || msg.direction === "داخل"
      );
      if (enterCandidate) {
        enterState = enterCandidate.status;
        enterUpdateTime = enterCandidate.sentTime;
      }
    }

    return {
      checkpoint: checkpoint._id,
      enterState,
      exitState,
      enterUpdateTime,
      exitUpdateTime,
    };
  });

  return result;
};


app.get('/checkpoints/:city', async (req, res) => {
  const { city } = req.params;
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).send("'from' and 'to' query parameters are required.");
  }

  try {
    const timeSeriesData = await fetchTimeSeries(city, from, to);
    const currentAggregations = await fetchAggregations(city, from, to);

    const duration = new Date(to) - new Date(from);
    const previousFrom = new Date(new Date(from) - duration);
    const previousTo = new Date(from);

    const previousAggregations = await fetchAggregations(city, previousFrom, previousTo);

    const response = {
      city,
      checkpoints: currentAggregations.map((current) => {
        const checkpointName = current._id;
        const previous = previousAggregations.find((prev) => prev._id === checkpointName) || {};

        const timeSeries = timeSeriesData
          .filter((record) => record._id.checkpoint === checkpointName)
          .map((record) => ({
            time: record._id.startTime,
            lastEnterState: record.lastEnterState || "Unknown",
            lastExitState: record.lastExitState || "Unknown"
          }));

        return {
          name: checkpointName,
          timeSeries,
          aggregations: {
            openEnterPercentage: ((current.openEnter || 0) / (current.totalEnter || 1)) * 100,
            openExitPercentage: ((current.openExit || 0) / (current.totalExit || 1)) * 100,
            closedEnterPercentage: ((current.closedEnter || 0) / (current.totalEnter || 1)) * 100,
            closedExitPercentage: ((current.closedExit || 0) / (current.totalExit || 1)) * 100,
            trafficEnterPercentage: ((current.trafficEnter || 0) / (current.totalEnter || 1)) * 100,
            trafficExitPercentage: ((current.trafficExit || 0) / (current.totalExit || 1)) * 100,
            openEnterTrend: calculateTrend(current.openEnter || 0, previous.openEnter || 0),
            openExitTrend: calculateTrend(current.openExit || 0, previous.openExit || 0),
            closedEnterTrend: calculateTrend(current.closedEnter || 0, previous.closedEnter || 0),
            closedExitTrend: calculateTrend(current.closedExit || 0, previous.closedExit || 0),
            trafficEnterTrend: calculateTrend(current.trafficEnter || 0, previous.trafficEnter || 0),
            trafficExitTrend: calculateTrend(current.trafficExit || 0, previous.trafficExit || 0),
            adminCount: current.adminCount || 0,
            nonAdminCount: (current.totalEnter || 0) - (current.adminCount || 0)
          }
        };
      })
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    //await client.close();
  }
});


app.get('/last-checkpoints/:city', async (req, res) => {
  const { city } = req.params;

  try {
    const data = await fetchLastCheckpointData(city);

    res.json({ city, checkpoints: data });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    //await client.close();
  }
});

const fetchReportHourlyData = async (db, from, to) => {
  const collection = db.collection("AggregationCount");
  return await collection
    .aggregate([
      {
        $match: {
          startTime: { $gte: new Date(from), $lt: new Date(to) },
        },
      },
      {
        $sort: { startTime: 1 },
      },
    ])
    .toArray();
};


const fetchGeneralAggregations = async (db, from, to) => {
  const collection = db.collection("AggregationCount");
  const data = await collection
    .aggregate([
      {
        $match: {
          startTime: { $gte: new Date(from), $lt: new Date(to) },
        },
      },
      {
        $sort: { "_id.startTime": 1 },
      },
    ])
    .toArray();

  const response = {
    totalReports: 0,
    cityCounts: {},
    checkpointCounts: {},
    directionCounts: {},
    statusCounts: {},
    groupCounts: {},
    adminCounts: {
      admin: 0,
      nonAdmin: 0,
    },
  };

  data.forEach((doc) => {
    response.totalReports += doc.count || 0;

    Object.keys(doc).forEach((key) => {
      if (key.startsWith("city_") && key.endsWith("_count")) {
        const cityName = key.replace("city_", "").replace("_count", "").replace(/_/g, " ");
        response.cityCounts[cityName] = (response.cityCounts[cityName] || 0) + doc[key];
      }

      if (key.startsWith("checkpoint_") && key.endsWith("_count")) {
        const checkpointName = key.replace("checkpoint_", "").replace("_count", "").replace(/_/g, " ");
        response.checkpointCounts[checkpointName] = (response.checkpointCounts[checkpointName] || 0) + doc[key];
      }

      if (key.startsWith("direction_") && key.endsWith("_count")) {
        const direction = key.replace("direction_", "").replace("_count", "");
        response.directionCounts[direction] = (response.directionCounts[direction] || 0) + doc[key];
      }

      if (key.startsWith("status_") && key.endsWith("_count")) {
        const status = key.replace("status_", "").replace("_count", "").replace(/_/g, " ");
        response.statusCounts[status] = (response.statusCounts[status] || 0) + doc[key];
      }

      if (key.startsWith("group_") && key.endsWith("_count")) {
        const group = key.replace("group_", "").replace("_count", "").replace(/_/g, " ");
        response.groupCounts[group] = (response.groupCounts[group] || 0) + doc[key];
      }

      if (key === "admin_count") {
        response.adminCounts.admin += doc[key] || 0;
      }

      if (key === "count") {
        response.adminCounts.nonAdmin += (doc[key] || 0) - (doc.admin_count || 0);
      }
    });
  });

  return response;
};

app.get('/widgets', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).send("'from' and 'to' query parameters are required.");
  }

  try {
    const [hourlyData, overallAggregations] = await Promise.all([
      fetchReportHourlyData(db, from, to),
      fetchGeneralAggregations(db, from, to),
    ]);

    const response = {
      ...overallAggregations,
      hourlyData: hourlyData.map((item) => ({
        time: item.startTime,
        totalReports: item.count,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching widgets data:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    //await client.close();
  }
});


app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});


