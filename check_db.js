const mongoose = require('mongoose');

async function checkDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agroDB');
    console.log('Connected to agroDB');
    
    // Define the schema so we can access it
    const userSchema = new mongoose.Schema({
      username: String,
      email: String
    });
    const User = mongoose.model('User', userSchema);
    
    const count = await User.countDocuments();
    console.log(`Total users in 'users' collection: ${count}`);
    
    const users = await User.find({}, { password: 0 });
    console.log('Users:', JSON.stringify(users, null, 2));
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in agroDB:', collections.map(c => c.name));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDB();
