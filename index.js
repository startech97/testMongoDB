const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
console.log(true)
const d1 = new Schema({
    country:  String,
    city: String,
    name:   String,
    longitude: Number,
    latitude: Number,
    location: [],
    students: [{year: Date, number: Number}]

})
const d2 = new Schema({
    country: String,
    overallStudents: Number,
    difference: Number
})
const d3 = new Schema({
    country: String,
    num: Number
})

const Data1 = mongoose.model('Data1', d1, 'data1');
const Data2 = mongoose.model('Data2', d2, 'data2');
const Data3 = mongoose.model('Data3', d3);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    async function start() {
        const all = {}
        await Data1.find({}, function(err, data) {
            data.forEach(async (item) => {
                const ll = item['location'][0]['ll']
                const sum = item['students'].reduce((a,b)=> {
                    return a + b['number']
                },0)
                all[item['country']] = sum
                await Data1.findOneAndUpdate({_id: item['_id']},{$set:{ longitude: ll[0], latitude: ll[1]}})
            })
        })
        const alldata = await Data1.find({})
        const country = {}
        alldata.forEach(item => {
            if(country[item['country']]) {
                country[item['country']] = country[item['country']] + 1
            }
            if(!country[item['country']]) {
                country[item['country']] = 1
            }
        })
        const countryArray =[]
        for(key in country) {
            const data = new Data3({country: key, num:country[key]})
            await data.save()
        }
        console.log(countryArray)
        await Data2.find({}, async function(err, data) {
            data.forEach(async (item) => {
                await Data2.findOneAndUpdate({country: item['country']},{difference: all[item['country']] - item['overallStudents']})
            })
        })
    }
    start()
});
