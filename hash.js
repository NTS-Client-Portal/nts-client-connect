const bcrypt = require('bcrypt');

const password = 'NtsGreen123!';
const hash = '$2b$10$hwioRltfuZGujsLov20TZ.VnbL1cxuX23OCSTXZJ1YZ3FOhhKk0G.';

bcrypt.compare(password, hash, (err, result) => {
  if (result) {
    console.log('Password matches hash!');
  } else {
    console.log('Password does NOT match hash!');
  }
});