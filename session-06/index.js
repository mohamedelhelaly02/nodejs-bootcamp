const { MongoClient } = require('mongodb');

const connectionString = 'mongodb+srv://me5260287_db_user:nodejs_123@learn-mongo-db.uvllaxb.mongodb.net/?appName=learn-mongo-db';

const client = new MongoClient(connectionString);

const main = async () => {
    await client.connect();
    console.log('Connected to database server successfully.');
    const db = client.db('codeZone');

    const postsCollection = db.collection('posts');

    const data = await postsCollection.find().toArray();

    console.log("data: ", data);

}

main();