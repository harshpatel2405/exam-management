import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`BatchFlow Examination Backend Server running on port ${PORT}`);
    console.log(`=======================================================`);
  });
};

startServer();
