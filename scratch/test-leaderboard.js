const { fetchLeaderboardFromMongo } = require('../app/lib/ai');

async function test() {
  console.log('Testing leaderboard fetch with no active user:');
  const list1 = await fetchLeaderboardFromMongo();
  console.log('Returned players count:', list1.length);
  list1.forEach((p, idx) => {
    console.log(`${idx + 1}. ID: ${p.id}, Display: ${p.displayName || p.email || 'None'}, Lvl: ${p.level}, XP: ${p.xp}`);
  });

  console.log('\nTesting leaderboard fetch with active user "snoYp6GmGENDRD1VtlVKqjOqMsU2":');
  const list2 = await fetchLeaderboardFromMongo('snoYp6GmGENDRD1VtlVKqjOqMsU2');
  console.log('Returned players count:', list2.length);
  list2.forEach((p, idx) => {
    console.log(`${idx + 1}. ID: ${p.id}, Display: ${p.displayName || p.email || 'None'}, Lvl: ${p.level}, XP: ${p.xp}`);
  });
  
  process.exit(0);
}

test();
