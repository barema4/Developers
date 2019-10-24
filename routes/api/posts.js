const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

const Post = require('../../models/post')

const Profile = require('../../models/profile')

router.get('/test', (req, res) => res.json({msg: 'posts works'}))

// Validation 
const ValidatePostInput = require('../../validation/post')

// Create posts
router.post('/', passport.authenticate('jwt', { session: false}), (req, res) => {
    const { errors, isValid } = ValidatePostInput(req.body)

    // Check validation
    if (!isValid) {
        // if any errors, send 400 with errors object
        return res.status(400).json(errors)
    }

    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        user: req.user.id
    })
    newPost.save().then(post => res.json(post))
})

// Get all posts

router.get('/', (req, res) => {
    Post.find()
        .sort({ date: -1 })
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({ nopostsfound: 'No posts found'}))
})
// Get a single post

router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({ nopostfound: 'No posts found with that ID'}))
})
// Deletes the post
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check for post owner
                    if(post.user.toString() !== req.user.id) {
                        return res.status(401).json({ notauthorized: 'User not authorized' })
                    }

                    // Delete
                    post.remove().then(() => res.json({ success: true}))
                })
                .catch(err => res.status(404).json({ postnotfound: 'No post found'}))
        })
})

// Like the post
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check for post owner
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                        return res.status(400).json({ alreadyliked: 'User already liked this post' })
                    }
                    // Add user
                    post.likes.unshift({ user: req.user.id })
                    
                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({ postnotfound: 'No post found'}))
        })
})


//Unlike the post
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check for post owner
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                        return res.status(400).json({ alreadyliked: 'User have not yet liked this post' })
                    }
                    // Get remove index to get user that we want to remove
                   const removeIndex = post.likes
                        .map(item => item.user.toString())
                        .indexOf(req.user.id)
                    // Splice out of array
                    post.likes.splice(removeIndex, 1)
                    
                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({ postnotfound: 'No post found'}))
        })
})

// Create comments to a post
router.post('/comment/:id', passport.authenticate('jwt', { session: false}), (req, res) => {
    const { errors, isValid } = ValidatePostInput(req.body)

    // Check validation
    if (!isValid) {
        // if any errors, send 400 with errors object
        return res.status(400).json(errors)
    }
    Post.findById(req.params.id)
        .then(post => {
            const newComment = {
                text: req.body.text,
                name: req.body.name,
                user: req.user.id
            }
        // Add to comments array
        post.comments.unshift(newComment)

        // save
        post.save().then(post => res.json(post))
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found'}))

        // newComment.save().then(post => res.json(post))
})

// Delete comment to a post
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false}), (req, res) => {
  
    Post.findById(req.params.id)
        .then(post => {
            // Check to see if comment exists

            if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0){
                return res.status(404).json({ commentnoexist: 'Comment does not exist'})
            }

            // Get remove index
            const removeIndex = post.comments
                .map(item => item._id.toString())
                .indexOf(req.params.comment_id)

            // Splice comment out of array
            post.comments.splice(removeIndex, 1)

            post.save().then(post => res.json(post))
            

        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found'}))

        // newComment.save().then(post => res.json(post))
})




module.exports = router