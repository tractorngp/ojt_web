const bcrypt  = require('bcryptjs');

const genSalt = bcrypt.genSalt(10).then(salt=>{
    const hpw = bcrypt.hashSync(genSalt,"test123");
    console.log(hpw);
});