const mongoose = require('mongoose');
const router = require('express').Router();
const passport = require('passport');
const User = mongoose.model('User');
const auth = require('../auth');

router.get('/user', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) return res.sendStatus(401);

      return res.json({ user: user.toAuthJSON() });
    })
    .catch(next);
});

router.put('/user', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) return res.sendStatus(401);

      // only update fields that were actually passed
      const updatedUser = req.body.user;
      user.username = updatedUser.username || user.username;
      user.email = updatedUser.email || user.email;
      user.bio = updatedUser.bio || user.bio;
      user.image = updatedUser.image || user.image;
      user.setPassword(updatedUser.password || user.password);

      return user.save().then(() => {
        return res.json({ user: user.toAuthJSON() });
      });
    })
    .catch(next);
});

router.post('/users/login', (req, res, next) => {
  if (!req.body.user.email)
    return res.status(422).json({ errors: { email: "can't be blank" } });

  if (!req.body.user.password)
    return res.status(422).json({ errors: { password: "can't be blank" } });

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (user) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

router.post('/users', (req, res, next) => {
  const user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user
    .save()
    .then(() => res.json({ user: user.toAuthJSON() }))
    .catch(next);
});

module.exports = router;
