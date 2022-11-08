const Owner = require('../models').Owner
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


const createToken = (id) => {
  const payload = { id }
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "1d" })
}

exports.loginOwner = async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      res.status(400).send("All fields must be filled")
    }

    // if (!validator.isEmail(email)) {
    //   res.status(400).send("Email not valid")
    // }


    const owner = await Owner.findOne({ where: { owner_email: email } })
    if (!owner) {
      res.status(401).send('Owner not found')
    }

    const match = await bcrypt.compare(password, owner.owner_password)
    if (!match) {
      res.status(401).send("Incorrect password!")
    }


    const token = createToken(owner.id)

    const data = {
      email: owner.owner_email,
      name: owner.owner_name,
      phone: owner.owner_phone,
      photo: owner.owner_photo,
      token: token
    }

    res.status(200).send({
      success: true,
      message: "Owner logged in",
      data
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.signupOwner = async (req, res) => {
  const { email, name, password, phone } = req.body

  try {
    if (!email || !password || !name || !phone) {
      res.status(400).send("All fields must be filled")
    }
    const oldOwner = await Owner.findOne({ where: { owner_email: email } })

    if (oldOwner) {
      res.status(400).send("Email is already in use")
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const owner = await Owner.create({
      owner_email: email,
      owner_name: name,
      owner_password: hash,
      owner_phone: phone,
      owner_photo: ""
    })

    const token = createToken(owner.id)
    const data = {
      email: owner.owner_email,
      name: owner.owner_name,
      phone: owner.owner_phone,
      photo: owner.owner_photo,
      token: token
    }


    res.status(200).send({
      success: true,
      message: "Owner registered",
      data
    })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllOwners = async (req, res) => {
  try {
    let owners = await Owner.findAll()
    res.status(200).send({
      success: true, owners
    })
  } catch (err) {
    res.status(500).send({
      message: err.messagee || "Some error occured while geeting owners"
    })
  }
}

exports.getOneOwner = async (req, res) => {
  try {
    let id = req.params.id
    let owner = await Owner.findOne({ where: { id: id } })
    res.status(200).send({
      success: true,
      owner
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while getting owner"
    })
  }
}

exports.updateOwner = async (req, res) => {
  try {
    let id = req.params.id
    const owner = await Owner.update(req.body, { where: { id: id } })
    const updatedOwner = await Owner.findOne({ where: { id: id } })
    res.status(200).send({
      succes: true,
      updatedOwner
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while updating owner"
    })
  }
}

exports.deleteOwner = async (req, res) => {
  try {
    let id = req.params.id
    const deletedOwner = await Owner.findOne({ where: { id: id } })
    await Owner.destroy({ where: { id: id } })
    res.status(200).send({
      success: true,
      message: "Owner is deleted",
      deletedOwner
    })
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occured while deleting owner"
    })
  }
}