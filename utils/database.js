import mongoose from 'mongoose';

const connectDB = async (mongoURI) => {
  try {
    await mongoose.connect(mongoURI, {
      // These options are deprecated in Mongoose 6+, but keeping them commented for older versions if any issue arises.
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true, // Not needed in Mongoose 6+
      // useFindAndModify: false // Not needed in Mongoose 6+
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;