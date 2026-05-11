const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ["identify", "guilds"]
},
(accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));
// Home
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

// Dashboard
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");
  res.render("dashboard", { user: req.user });
});

// Login
app.get("/auth/discord",
  passport.authenticate("discord")
);

// Callback
app.get("/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/"
  }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => {});
  res.redirect("/");
});
app.get("/guilds", async (req, res) => {
  if (!req.user) return res.status(401).json([]);

  try {
    const fetch = require("node-fetch");

    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${req.user.accessToken}`
      }
    });

    const guilds = await response.json();
    res.json(guilds);

  } catch (err) {
    console.log(err);
    res.status(500).json([]);
  }
});
  app.get("/dashboard/:id", (req, res) => {
  if (!req.user) return res.redirect("/");

  res.render("guild", {
    user: req.user,
    guildId: req.params.id
  });
});
app.listen(process.env.PORT || 3000, () => {
  console.log("Dashboard running...");
});
