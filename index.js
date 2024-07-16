require('dotenv').config()
const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;

// Configuration
const windowSize = 10;
let numbers = [];

// Utility functions
const isQualified = (number, qualifier) => {
  if (qualifier === 'p') return isPrime(number);
  if(qualifier === 'f') return isFibonacci(number);
  if(qualifier === 'r') return generateRandomNumbers(windowSize);
  if (qualifier === 'e') return number % 2 === 0;
  // Assume third-party server provides correct qualified Fibonacci or random numbers
  return true;
};

const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

const isFibonacci = (num) => {
    const isPerfectSquare = (x) => {
        let s = Math.sqrt(x);
        return (s * s === x);
    };
    return isPerfectSquare(5 * num * num + 4) || isPerfectSquare(5 * num * num - 4);
};

const generateRandomNumbers = (count = 1) => {
    const randomNumbers = [];
    for (let i = 0; i < count; i++) {
        const randomNum = Math.floor(Math.random() * 100); // Generating random numbers between 0 and 99
        randomNumbers.push(randomNum);
    }
    return randomNumbers;
};

// Fetch numbers from third-party server
const fetchNumbers = async (numberId) => {
  try {
    const response = await axios.get(`http://20.244.56.144/test/${numberId}`,{timeout:5000,headers:{Authorization:`Bearer ${process.env.bearerToken}`}});
    return response.data.numbers; // Adjust based on actual response format
  } catch (error) {
    console.error('Error fetching numbers:', error.message);
    return [];
  }
};

app.get('/numbers/:numberId', async (req, res) => {
  const numberId = req.params.numberId;

  // Fetch numbers from the third-party server
  console.log(numberId);
  const fetchedNumbers =  await fetchNumbers(numberId);

  // Filter qualified numbers and remove duplicates
  const newNumbers = fetchedNumbers.filter((num, index) => 
    isQualified(num, numberId) && numbers.indexOf(num) === -1
  );

  // Manage the window of numbers
  newNumbers.forEach(num => {
    if (numbers.length >= windowSize) {
      numbers.shift(); // Remove oldest number
    }
    numbers.push(num); // Add new number
  });

  // Calculate the average
  const average = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;

  // Prepare the response
  const response = {
    windowPrevState: [...numbers],
    windowCurrState: numbers,
    fetchedNumbers: fetchedNumbers,
    average: average
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Average Calculator microservice running at http://localhost:${port}`);
});