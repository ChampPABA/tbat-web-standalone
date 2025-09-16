import Redis from "ioredis";

async function testRedis() {
  console.log("🔴 Testing Redis Connection...\n");

  const redis = new Redis({
    host: "localhost",
    port: 6379,
  });

  try {
    // Test 1: Ping
    const pong = await redis.ping();
    console.log(`✅ Ping test: ${pong}`);

    // Test 2: Set and Get
    await redis.set("test:key", "Hello Redis!");
    const value = await redis.get("test:key");
    console.log(`✅ Set/Get test: ${value}`);

    // Test 3: Set with TTL
    await redis.setex("test:ttl", 60, "Expires in 60 seconds");
    const ttl = await redis.ttl("test:ttl");
    console.log(`✅ TTL test: Key expires in ${ttl} seconds`);

    // Test 4: Hash operations
    await redis.hset("test:hash", "field1", "value1", "field2", "value2");
    const hashValues = await redis.hgetall("test:hash");
    console.log("✅ Hash test:", hashValues);

    // Test 5: List operations
    await redis.lpush("test:list", "item1", "item2", "item3");
    const listLength = await redis.llen("test:list");
    console.log(`✅ List test: ${listLength} items`);

    // Test 6: Cleanup
    await redis.del("test:key", "test:ttl", "test:hash", "test:list");
    console.log("✅ Cleanup completed");

    console.log("\n✅ Redis connection and operations working correctly!");
  } catch (error) {
    console.error("❌ Redis error:", error);
  } finally {
    redis.disconnect();
  }
}

testRedis();
