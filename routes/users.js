"use strict";

const cookieSession = require('cookie-session');
const router        = require('express').Router();
const bcrypt        = require('bcrypt');
const auth          = require('./lib/authenticate');



function makeUserObject(requestObject){
  const hash = bcrypt.hashSync(requestObject.password, 10);
  return {
      username: requestObject.username || '@Pat',
      first_name: requestObject.first_name || 'pdqwat',
      last_name: requestObject.last_name || 'dndqjewd',
      email: requestObject.email || "1dqw23@123",
      password: hash || '12dqw34'
    }
}


module.exports = (knex, app) => {

  const db_helper = require('./lib/db-helpers.js')(knex);
  app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  }));


  router.get('/', (req, res) => {
    if(!req.session.user_id){
      return res.status(201).send(
        {loggedin: false}
      )
    }
    const userid = req.session.user_id;
    db_helper.getUser('userid', userid)
    .then((user) => {
      return res.status(200).send(
        {
          loggedin: true,
          userid: user[0].userid,
          first_name: user[0].first_name,
          username: user[0].username,
          last_name: user[0].last_name
        }
      );
    })
    .catch((err) => {return res.status(500).send("Problem with the Database")})

  })

  router.post('/register', (req, res) => {
    const userObj = makeUserObject(req.body)
    let p1 = db_helper.isUsernameInUsers
    let p2 = db_helper.newDbInput
    let p3 = db_helper.getUserId

    p1(userObj.username)
      .then((err) => {
        if(err){
         return res.status(400).send('User already in DataBase')
        }
        return p2('users', userObj)
          .then(() => {
          return p3(userObj.username)
            .then((value) => {
              req.session.user_id = value[0].userid;
              return res.status(201).send(
                JSON.stringify({
                  loggedin: true,
                  userid: userObj.userid,
                  first_name: userObj.first_name,
                  username: userObj.username,
                  last_name: userObj.last_name
                }));
            });
          });
      });
  });

  router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if(!username || !password){
      return res.status(400).send("Username or password not provided");
    }

    db_helper.getUser('username', username).then((user) => {
      if(!user.length){
        return res.status(400).end("Your username is not valid");
      }
      if(!bcrypt.compareSync(password, user[0].password)){
        return res.status(401).end("Wrong password, try again");
      }
       req.session.user_id = user[0].userid;
       res.send(
         JSON.stringify({
           loggedin: true,
           userid: user[0].userid,
           first_name: user[0].first_name,
           username: user[0].username,
           last_name: user[0].last_name
        })
      );
    })
  });

  router.post('/logout', (req, res) => {
    req.session = null;
    res.status(200).end("Successfully Logged Out!")
    return;
  });

  return router;
}
