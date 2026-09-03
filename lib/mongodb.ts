import mongoose, { Mongoose } from 'mongoose';

/**
 * Cached connection type. We extend the global object so the cache persists
 * across hot reloads in dev and across serverless cold starts in production.
 */
type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local',
  );
}

/**
 * Initialize the cache on the global object. Reusing the cached connection
 * prevents Mongoose from opening a new socket on every serverless invocation,
 * which would otherwise exhaust Atlas connection limits very quickly.
 */
const cached: MongooseCache =
  global.mongooseCache ?? (global.mongooseCache = { conn: null, promise: null });

async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset the promise so the next call can attempt a fresh connection
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;