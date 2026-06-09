const mongoose = require('mongoose');

// MongoDB URI from .env
const MONGODB_URI = 'mongodb://hanishkamakshigari_db_user:bfiJRfbn9KrnMu82@ac-1qexjsq-shard-00-00.isioovi.mongodb.net:27017,ac-1qexjsq-shard-00-01.isioovi.mongodb.net:27017,ac-1qexjsq-shard-00-02.isioovi.mongodb.net:27017/sagacore?ssl=true&replicaSet=atlas-nj7bjx-shard-0&authSource=admin&appName=Cluster0';

async function inspectUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const playerstates = await db.collection('playerstates').find().toArray();
    console.log(`Found ${playerstates.length} playerstates:`);
    playerstates.forEach(p => {
      console.log({
        id: p.id,
        email: p.email,
        displayName: p.displayName,
        level: p.level,
        xp: p.xp,
        theme: p.worldTheme
      });
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

inspectUsers();
