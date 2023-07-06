const mysql=require('mysql');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {promisify}=require('util');

const db=mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE,
});

exports.login=async(req,res)=>{ 
    try {
        const {email,password}=req.body;
        if(!email || !password){
            return res.render("login",
            {
            msg:'enter all details',
            msg_type:'err'});
        }
        db.query("select * from users where email=?",[email],async (err,result)=>{
          console.log(result);
          if(result.length<=0){
            return res.render("login",{
                msg:"please enter correct email and password",
                msg_type:"err"
            });
          }else{
            if(!(await bcrypt.compare(password,result[0].password))){
                return res.status(401).render("login",{
                    msg:"please enter correct email and password",
                    msg_type:'err'
                });
            }else{
               const id=result[0].id;
               const token=jwt.sign({id:id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN,
            });
            console.log(token);
            const cookieOptions={
                expire:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("vijay",token,cookieOptions);
            res.status(200).redirect('/home');
            }
          }
        });
    } catch (error) {
     console.log(error);   
    }
};
exports.register=(req,res)=>{
    /*console.log(req.body);
    const name=req.body.name;
    const email=req.body.email;
    const password=req.body.password;
    const confirm_password=req.body.confirm_password;
    console.log(name);
    console.log(email);
    console.log(password);
    console.log(confirm_password);*/
    const {name,email,password,confirm_password}=req.body;
    db.query("select email from users where email=?",[email],async (err,result)=>{
        if(err){
            console.log(err);
        }
        if(result.length>0){
            return res.render('register',{msg:'email exists,please login',msg_type:'err'})
        }else if(password !== confirm_password){
            return res.render('register',{msg:'confirm password must be same',msg_type:'err'})
        }
        let hashedpassword= await bcrypt.hash(password,8);
        db.query('insert into users set ?',{name:name,email:email,password:hashedpassword},(err,result)=>{
            if(err){console.log(err);}
            else{
                console.log(result);
                return res.render('register',{msg:'registration successfull',msg_type:'good'});
            }
        })
    })
};
exports.isLoggedIn=async(req,res,next) =>{
    //console.log(req.cookies);
    if(req.cookies.vijay){
        try {    
        const decode=await promisify(jwt.verify)(
            req.cookies.vijay,process.env.JWT_SECRET
        );
        console.log(decode);
        db.query('select * from users where id=?',[decode.id],(err,result)=>{
            console.log(result);
            if(!result){
                return next();
            }
            req.user=result[0];
            return next();
        });
        } catch (error) {
            console.log(error);
            return next();
        }
    }else{
       next();
    }   
}
exports.logout=async(req,res)=>{
    req.cookies('vijay','logout',{
        expires:new Date(Date.now()*2*1000),
        httpOnly:true,
    });
    res.status(200).redirect('/');
};
