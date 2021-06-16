const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient("mongodb://localhost:27017/", {useUnifiedTopology: true});
mongoClient.connect(function(err, client){
    if(err){
        return console.log(err);
    }
    const db = client.db("test");
    const collection = db.collection("data1");
    const secondCollection = db.collection("data2")
    collection.updateMany({},[{$set:{"longitude": {"$arrayElemAt":["$location.ll",0]},"latitude": {"$arrayElemAt":["$location.ll",1]}}}])
    collection.aggregate([
        {"$lookup":{
          "from": "data2",
          "localField": "country",
          "foreignField": "country",
          "as": "data2"
        }}
        ,{
    $unwind: {path:'$students'}
    },
    {
        $group:
            {
                _id: "$_id",
                'sum': { $sum: { $multiply: [ "$students.number" ] } },
                'overall':{$addToSet: {"$arrayElemAt":["$data2",0]} }
            }
    },
    {
        $set: {"overall": {"$arrayElemAt":["$overall",0]}},
    },{
        $set: {"overall": "$overall.overallStudents"}
    },{
        $addFields : {
            different : {$subtract: [ "$sum", "$overall" ]}
        }
    }
      ],{ 'allowDiskUse': true}).toArray(function(err, docs) {
          docs.forEach((item)=> {
            collection.findOneAndUpdate({_id: item["_id"]},{$set:{'different': item['different']}})
          })
        // console.log(JSON.stringify(docs,null,2));
      });

      collection.aggregate([
        {$group: {_id:{country : "$country"},count: { $sum: 1 },
        "allDiffs":{$addToSet:'$different'},
        "longitudes":{$addToSet:'$longitude'},
        "latitudes":{$addToSet:'$latitude'}
        },
        },
        {$set:{_id: "$_id.country"}},
        {$out: "count"}
      ]).toArray(function(err, docs) {
    //   console.log(JSON.stringify(docs,null,2));
    });

});