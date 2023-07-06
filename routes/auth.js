const express=require('express');
const usercontroller=require('../controllers/users');
const router=express.Router();

router.post('/register',usercontroller.register);

router.post('/login',usercontroller.login);

router.get('/logout',usercontroller.logout);

module.exports=router