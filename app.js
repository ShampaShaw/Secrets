const cookieParser = require('cookie-parser');
if (process.env.NODE_ENV !== 'production') { require('dotenv').config() }
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const cookiesession = require("cookie-session");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const flash = require('connect-flash');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

//console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookiesession({
    secrets: "Ice Cream",
    keys: "mysite.sid.uid.whatever",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash())
// global variables. Creating our own middleware. Custom middleware coming from flash
app.use((req, res, next) => { // color code the message type
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useUnifiedTopology : true, useNewUrlParser : true , }).then(() => {
    console.log("Connection successfull");
 }).catch((e) => console.log("No connection"));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//userSchema.plugin(passportLocalMongoose, { usernameField: 'email', errorMessages : { UserExistsError : 'A user with the given email is already registered.' } });
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
})

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password)
    .then(function(err){
      if (err) {
        console.log(err);
        req.flash("error",err.message);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
    });
  
  });

app.post("/login",function(req,res){
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
            })
        }
    });

});  

app.listen(3000,function(){
    console.log("Server Started on port 3000");
});
