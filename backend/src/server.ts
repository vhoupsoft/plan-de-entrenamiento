import app from './app';
import prisma from './prismaClient';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (err) {
    console.error('DB connection error', err);
  }
});
