const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const registered_users = express.Router();

let users = [{
  username: "ehtisham",
  password: "123"
}, {
  username: "hashmi",
  password: "321"
}];


const isValid = (username) => {
  let userswithsamename = users.filter((user) => {
    return user.username === username
  });
  if (userswithsamename.length > 0) {
    return true;
  } else {
    return false;
  }
}

const authenticatedUser = (username, password) => {
  let validusers = users.filter((user) => {
    return (user.username === username && user.password === password)
  });
  if (validusers.length > 0) {
    return true;
  } else {
    return false;
  }
}

//only registered users can login

registered_users.post("/login", (req, res) => {
  const username = req.query.username;
  const password = req.query.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in" });
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({data: password}, 'fingerprint_customer', { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken, username
    }
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});




// Add a book review
registered_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  const { isbn } = req.params
  const review = req.query.review;
  // username will get from jwt session 
  const username = req.session.authorization.username;

  const getBooks = Object.keys(books)
  // Get book by ISBN number first and the its reviews
  let mybook = getBooks.find((book) => book === isbn);
  let getBookReviewByISBN = books[mybook].reviews

  // If book has already a review
  if (getBookReviewByISBN !== undefined) {

    // check if the user has already submitted a review for this book
    if (getBookReviewByISBN.hasOwnProperty(username)) {

      // if yes, modify the existing review
      getBookReviewByISBN[username].review = review;

    } else {
      // if not, add a new review under the same ISBN
      getBookReviewByISBN[username] = { username, review };
    }

    return res.status(200).send(`The Review for book with ${isbn} has been added/updated successfully`)

  }
  // No reviewes yet, add new Review
  else {

    // if there are no reviews for this book yet, add a new review
    getBookReviewByISBN = {};
    getBookReviewByISBN = { 'username': username, "review": review };
    books[mybook].reviews = getBookReviewByISBN;
    return res.status(200).send(`The Review for book with ${isbn} has been added/updated successfully`)

  }
});

//Delete a book review
registered_users.delete("/auth/review/:isbn", (req, res) => {

  const { isbn } = req.params;

  // username will get from jwt session 
  const { username } = req.session.authorization;

  const getBooks = Object.keys(books)
  // Get book by ISBN number first and the its reviews
  let mybook = getBooks.find((book) => book === isbn);
  let getBookReviewByISBN = books[mybook].reviews;


  if (getBookReviewByISBN !== undefined && getBookReviewByISBN.hasOwnProperty(username)) {
    delete getBookReviewByISBN[username];
    return res.status(200).send(`Review for ISBN ${isbn} posted by user ${username} deleted`);  // Delete the review object for the user
  }

  for (let book in books) {
    if (!books[book].reviews.hasOwnProperty(username)) {
      return res.status(404).send(`Review not found for the ISBN ${isbn} posted by user ${username}`);
    }
  }


});


module.exports.authenticated = registered_users;
module.exports.isValid = isValid;
module.exports.users = users;