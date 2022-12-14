const User = require('../models').User
const Application = require('../models').Application
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cloudinary = require('../utils/cloudinary')


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
      return
    }

    // if (!validator.isEmail(email)) {
    //   res.status(400).send("Email not valid")
    // }


    const user = await User.findOne({ where: { user_email: email } })
    if (!user) {
      res.status(401).send('User not found')
      return
    }

    const match = await bcrypt.compare(password, user.user_password)
    if (!match) {
      res.status(401).send("Incorrect password!")
      return
    }

    const token = createToken(user.id)

    const data = {
      id: user.id,
      email: user.user_email,
      name: user.user_name,
      phone: user.user_phone,
      photo: user.user_photo,
      description: user.user_description,
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
      return
    }
    const oldUser = await User.findOne({ where: { user_email: email } })

    if (oldUser) {
      res.status(400).send("Email is already in use")
      return
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
      id: user.id,
      email: user.user_email,
      name: user.user_name,
      phone: user.user_phone,
      photo: user.user_photo,
      description: user.user_description,
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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll()
    res.status(200).send({
      success: true, users
    })

    // const limit = req.query.size || 10
    // const offset = req.query.page || 0

    // const users = await User.findAndCountAll({
    //   limit: limit,
    //   offset: offset,
    //   attributes: ['id', 'user_email', 'user_name', 'user_phone', 'user_photo', 'createdAt', 'updatedAt']
    // })
    // res.status(200).send({
    //   success: true,
    //   users,
    //   totalPages: Math.ceil(users.count / Number.parseInt(limit))
    // })
  } catch (err) {
    res.status(500).send({
      message: err.messagee || "Some error occured while geeting users"
    })
  }
}

exports.getOneUser = async (req, res) => {
  try {
    let id = req.params.id
    let user = await User.findOne({ where: { id: id } })
    res.status(200).send({
      success: true,
      user
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while getting user"
    })
  }
}

exports.updateUser = async (req, res) => {
  try {
    const { user_name, user_email, user_phone, user_description } = req.body
    let id = req.params.id

    if (req.file) {
      const img = await cloudinary.uploader.upload(req.file.path, {
        folder: "musikin/user/"
      })

      const user = await User.update({
        user_name: user_name,
        user_email: user_email,
        user_phone: user_phone,
        user_description: user_description,
        user_photo: img.secure_url
      }, {
        where: {
          id: id
        }
      })
    } else {
      const user = await User.update({
        user_name: user_name,
        user_email: user_email,
        user_phone: user_phone,
        user_description: user_description
      }, {
        where: {
          id: id
        }
      })
    }


    const updatedUser = await User.findOne({ where: { id: id } })
    res.status(200).send({
      succes: true,
      updatedUser
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while updating user"
    })
  }
}

// FIX: image for deleted item is not deleted from cloudinary storage
exports.deleteUser = async (req, res) => {
  try {
    let id = req.params.id
    const deletedUser = await User.findOne({ where: { id: id } })
    await User.destroy({ where: { id: id } })
    res.status(200).send({
      success: true,
      message: "User is deleted",
      deletedUser
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while deleting user"
    })
  }
}

exports.updateUserPassword = async (req, res) => {
  try {
    const { password, verifyPassword } = req.body
    let id = req.params.id

    if (password !== verifyPassword) {
      res.status(400).send("Please verify the password")
      return
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    await User.update({
      user_password: hash
    }, { where: { id: id } })

    const updatedUser = await User.findOne({ where: { id: id } })
    res.status(200).send({
      succes: true,
      updatedUser
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while updating owner password"
    })
  }
}

exports.getMyApplications = async (req, res) => {
  try {
    let id = req.params.id

    let application = await Application.findAll({
      where: {
        user_id: id
      },
      include: [
        {
          association: "gig",
          attributes: ['title', 'fee', 'location']
        }
      ]
    })


    // let application = await Application.findAll({
    //   include: [{
    //     association: "gig",
    //     attributes: ['title', 'fee']
    //   }]
    // }, { where: { user_id: id } })
    res.status(200).send({
      success: true,
      application
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while getting your gigs"
    })
  }
}