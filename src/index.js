const cron = require('node-cron');
const collector1 = require('./collectors/collector1');
const collector2 = require('./collectors/collector2');
// Add additional collectors as needed

// Schedule a job to run every hour
cron.schedule('0 * * * *', () => {
  console.log('Running collectors...');
  collector1.collect();
  collector2.collect();
  // Call additional collectors as needed
});

// You can also run collectors immediately when the script starts
collector1.collect();
collector2.collect();
// Call additional collectors as needed

console.log('News Feeder Bot is running...');
