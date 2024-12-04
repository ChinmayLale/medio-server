const autocannon = require('autocannon');

// Common options
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NmJmNjY1MjBhNGMwNTI0ZmY2YTQwYzQiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwidXNlcm5hbWUiOiJ0ZXN0IiwiZnVsbE5hbWUiOiJ0ZXN0IiwiaWF0IjoxNzMzMDczMTgyLCJleHAiOjE3MzMxNTk1ODJ9.IQFEmDZWN2gO8p-JMqBsN_S2o3xvOx_UyoCTi9PZffE'; // Replace with your actual token

// Endpoint 1: Appointment History
const appointmentHistoryOptions = {
  url: 'http://localhost:8000/api/v1/users/appointmentHistory',
  connections: 10, // Number of concurrent connections
  pipelining: 1,    // Number of pipelined requests per connection
  duration: 30,     // Test duration in seconds
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
};

// Endpoint 2: All Reports
const allReportsOptions = {
  url: 'http://localhost:8000/api/v1/users/allReports',
  connections: 50, // Number of concurrent connections
  pipelining: 2,    // Number of pipelined requests per connection
  duration: 30,     // Test duration in seconds
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
};

// Function to run autocannon
const runAutocannon = (options) =>
  new Promise((resolve, reject) => {
    const instance = autocannon(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

    autocannon.track(instance, { renderProgressBar: true });
  });

// Run both load tests
(async () => {
  try {
    console.log('Running load test on appointment history endpoint...');
    const appointmentHistoryResult = await runAutocannon(appointmentHistoryOptions);
    console.log('Appointment history test completed:', appointmentHistoryResult);

    console.log('Running load test on all reports endpoint...');
    const allReportsResult = await runAutocannon(allReportsOptions);
    console.log('All reports test completed:', allReportsResult);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
