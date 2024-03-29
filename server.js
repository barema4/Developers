const express = require('express')

const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const passport = require('passport')

const users = require('./routes/api/users')
const profile = require('./routes/api/profile')
const posts = require('./routes/api/posts')

const app = express()


// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// Database config
const db = require('./config/keys').mongoURI
// connect to mongoose

mongoose.connect(db)
.then(()=> {
    console.log('Database connected')
})
.catch(error => console.log(error))

// passport middleware
app.use(passport.initialize())

// passport Config
require('./config/passport')(passport)

app.use('/api/users', users)
app.use('/api/profile', profile)
app.use('/api/posts', posts)

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Server running on port ${port}`))