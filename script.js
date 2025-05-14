const MIN = 100;
const MAX = 999;
const pinInput = document.getElementById('pin');
const sha256HashView = document.getElementById('sha256-hash');
const resultView = document.getElementById('result');
const hintButton = document.getElementById('hint');
const hintText = document.getElementById('hint-text');

// a function to store in the local storage
function store(key, value) {
  localStorage.setItem(key, value);
}

// a function to retrieve from the local storage
function retrieve(key) {
  return localStorage.getItem(key);
}

function getRandomArbitrary(min, max) {
  let cached;
  cached = Math.random() * (max - min) + min;
  cached = Math.floor(cached);
  return cached;
}

// a function to clear the local storage
function clear() {
  localStorage.clear();
}

// a function to generate sha256 hash of the given string
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

async function getSHA256Hash() {
  let cached = retrieve('sha256');
  if (cached) {
    return cached;
  }

  // Generate a random 3-digit number
  const randomNumber = getRandomArbitrary(MIN, MAX);
  // Store the original number for verification
  store('original', randomNumber.toString());
  // Generate the SHA256 hash of the number
  cached = await sha256(randomNumber.toString());
  // Store the hash
  store('sha256', cached);
  return cached;
}

async function main() {
  sha256HashView.innerHTML = 'Calculating...';
  const hash = await getSHA256Hash();
  sha256HashView.innerHTML = hash;
  // Reset attempts counter
  store('attempts', '0');
}

async function test() {
  const pin = pinInput.value;

  if (pin.length !== 3) {
    resultView.innerHTML = '💡 not 3 digits';
    resultView.classList.remove('hidden');
    return;
  }

  // Increment attempts counter
  let attempts = parseInt(retrieve('attempts') || '0');
  attempts++;
  store('attempts', attempts.toString());

  const sha256HashView = document.getElementById('sha256-hash');
  const hashedPin = await sha256(pin);

  if (hashedPin === sha256HashView.innerHTML) {
    const attempts = retrieve('attempts');
    resultView.innerHTML = `🎉 Success! The correct number was ${retrieve('original')}. You solved it in ${attempts} attempt${attempts === '1' ? '' : 's'}.`;
    resultView.classList.add('success');

    // Reset the game after 3 seconds
    setTimeout(() => {
      clear();
      pinInput.value = '';
      resultView.classList.add('hidden');
      resultView.classList.remove('success');
      hintText.classList.add('hidden');
      main(); // Generate a new hash
    }, 3000);
  } else {
    const attempts = retrieve('attempts');
    resultView.innerHTML = `❌ Failed, try again! Attempts: ${attempts}`;
  }
  resultView.classList.remove('hidden');
}

// ensure pinInput only accepts numbers and is 3 digits long
pinInput.addEventListener('input', (e) => {
  const { value } = e.target;
  pinInput.value = value.replace(/\D/g, '').slice(0, 3);
});

// Function to provide a hint
function giveHint() {
  const originalNumber = retrieve('original');
  if (!originalNumber) {
    hintText.innerHTML = 'No hint available yet. Try refreshing the page.';
    hintText.classList.remove('hidden');
    return;
  }

  // Give a hint about the range
  const num = parseInt(originalNumber);
  let rangeHint;

  if (num <= 300) {
    rangeHint = 'The number is between 100 and 300.';
  } else if (num <= 600) {
    rangeHint = 'The number is between 301 and 600.';
  } else {
    rangeHint = 'The number is between 601 and 999.';
  }

  // Give a hint about whether it's odd or even
  const parityHint = num % 2 === 0 ? 'The number is even.' : 'The number is odd.';

  // Give a hint about the sum of digits
  const sumOfDigits = originalNumber.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  const sumHint = `The sum of the digits is ${sumOfDigits}.`;

  // Get the number of attempts
  const attempts = retrieve('attempts') || '0';
  const attemptsText = `You've made ${attempts} attempt${attempts === '1' ? '' : 's'} so far.`;

  hintText.innerHTML = `${attemptsText}<br>${rangeHint}<br>${parityHint}<br>${sumHint}`;
  hintText.classList.remove('hidden');
}

// attach the test function to the button
document.getElementById('check').addEventListener('click', test);

// attach the hint function to the hint button
hintButton.addEventListener('click', giveHint);

main();
