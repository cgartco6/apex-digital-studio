// backend/routes/auth.routes.js
router.post('/register-webauthn', authMiddleware.protect, async (req, res) => {
  const registration = await webauthn.register(req.user.id);
  res.json(registration);
});

router.post('/login-webauthn', async (req, res) => {
  const login = await webauthn.authenticate(req.body);
  if (login.verified) {
    const token = jwt.sign({ userId: login.userId }, process.env.JWT_SECRET);
    res.json({ token });
  }
});
