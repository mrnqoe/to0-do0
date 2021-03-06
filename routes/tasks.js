"use strict";
const router  = require('express').Router();
const auth    = require('./lib/authenticate');
const categorizer = require('./lib/categorizer');

module.exports = (knex) => {
  const db_helper = require('./lib/db-helpers.js')(knex);

  router.get("/", (req, res) => {
    let userid = auth(req, res);
    db_helper.showAllTasksFromUser(userid)
    .then((response) => {return res.json(response)});
  });

  router.get("/active", (req, res) => {
    let userid = auth(req, res);
    db_helper.showAllActiveTasksFromUser(userid)
    .then((response) => {
      return res.json(response)
    })
  });

  router.get('/All', (req, res) => {
    return res.redirect('/')
  })

  router.get("/:category", (req, res) => {
    let category = req.params.category;
    let userid = auth(req, res);
    db_helper.showAllFromCategory(userid, category)
    .then((result) => {
      return res.status(200).json(result)} )
  })

  router.post("/new", (req, res) => {
    if(!req.body.task_name){
      return res.status(500).end("You cannot send an empty task")
    }
    let userid = auth(req, res);
    const taskObj = {
      user_id: userid,
      task_name: req.body.task_name,
      category_id: categorizer(req.body.task_name),
      isComplete: req.body.isComplete || false
    };

    db_helper.getTaskFromUser(taskObj.task_name, taskObj.user_id, taskObj.isComplete)
    .then((result) => {
      if(result.length > 0){
        return res.status(401).send("Task already in the list and active")
      }
      return db_helper.newDbInput('tasks', taskObj).then(() => {
        return res.status(200).send("Posted to Db")
      });
    })

  });

  router.post("/edit", (req, res) => {
    let userid = auth(req, res);
    const taskObj = {
      taskid : req.body.taskid,
      state : req.body.isComplete
    }
    return db_helper.editTask(userid ,taskObj.taskid, {isComplete: taskObj.state})
  })

  router.post("/edit/category", (req, res) => {
    let userid = auth(req, res);
    console.log(req.body)
    const taskObj = {
      taskid : req.body.taskid,
      category_id : req.body.category_id
    }
    return db_helper.editTask(userid ,taskObj.taskid, {category_id: taskObj.category_id})
  })

  return router;
}
