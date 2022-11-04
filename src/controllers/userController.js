const User = require('../models').User
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


const createToken = (id) => {
  const payload = { id }
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "1d" })
}

exports.loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      res.status(400).send("All fields must be filled")
    }

    // if (!validator.isEmail(email)) {
    //   res.status(400).send("Email not valid")
    // }


    const user = await User.findOne({ where: { user_email: email } })
    if (!user) {
      res.status(401).send('User not found')
    }

    const match = await bcrypt.compare(password, user.user_password)
    if (!match) {
      res.status(401).send("Incorrect password!")
    }

    const token = createToken(user.id)

    const data = {
      email: user.user_email,
      name: user.user_name,
      phone: user.user_phone,
      photo: user.user_photo,
      token: token
    }
    res.status(200).send({
      success: true,
      message: "User logged in",
      data
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.signupUser = async (req, res) => {
  const { email, name, password, phone } = req.body

  try {
    if (!email || !password || !name || !phone) {
      res.status(400).send("All fields must be filled")
    }
    const oldUser = await User.findOne({ where: { user_email: email } })

    if (oldUser) {
      res.status(400).send("Email is already in use")
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const user = await User.create({
      user_email: email,
      user_name: name,
      user_password: hash,
      user_phone: phone,
      user_photo: ""
    })

    const token = createToken(user.id)

    const data = {
      email: user.user_email,
      name: user.user_name,
      phone: user.user_phone,
      photo: user.user_photo,
      token: token
    }
    res.status(200).send({
      success: true,
      message: "User logged in",
      data
    })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}