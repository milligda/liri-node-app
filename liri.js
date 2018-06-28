// utilize dotenv to load the config settings and API keys
require("dotenv").config();

// required packages
var inquirer = require('inquirer');
var Spotify = require('node-spotify-api');
var Twitter = require('twitter');
var request = require('request');
var fs = require('fs');

// pull in the Spotify, Twitter and OMDB API keys
var config = require('./keys.js');
var spotifyKey = Object(config.spotify);
var twitterKey = Object(config.twitter);
var omdbKey = Object(config.omdb);

// create new instances for spotify and twitter
var spotify = new Spotify(spotifyKey);
var client = new Twitter(twitterKey);

// set the OMDB API key
var omdbAPI = "apikey=" + omdbKey.api_key;

// variables for storing the user inputs
var spotifyQuery = "The Sign";
var twitterUser = "nytimes";
var movieName = "Mr Nobody";

// variable for the log file
var log = "log.txt"

// initial function prompting the user to select an option
function runActionPrompt() {

    // prompt the user
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            choices: ["Read My Tweets", "Find A Song", "Find A Movie", "Run The Instructions"],
            name: "action"
        }
    ]).then(function(inquirerResponse) {
    
        // pass the response to the determineAction function
        determineAction(inquirerResponse.action);
    });
}

// function that determines which action the user selected and then calls the subsequent function
function determineAction(op) {
    switch(op) {
        case "Read My Tweets":
            runTwitterPrompt();
            break;
        case "Find A Song":
            runSpotifyPrompt();
            break;
        case "Find A Movie":
            runMoviePrompt();
            break;
        case "Run The Instructions":
            runInstructions();
            break;
        default:
            console.log("you have selected an invalid choice");
    }
}

// function for when a user wants to find a song
function runSpotifyPrompt() {

    // prompt the user to input the name of the song they are looking for
    inquirer.prompt([
        {
            type: "input",
            message: "What song would you like to find?",
            name: "songInput"
        }
    ]).then(function(inquirerResponse) {

        // store the song response in the spotifyQuery variable
        spotifyQuery = inquirerResponse.songInput;

        // call the getSpotifySong function
        getSpotifySong();
    });
}

// function for when a user wants to read their tweets
function runTwitterPrompt() {

    // prompt the user to input a twitter username
    inquirer.prompt([
        {
            type: "input",
            message: "What is your twitter username?",
            name: "username"
        }
    ]).then(function(inquirerResponse) {

        // stores the username entered in the twitterUser variable
        twitterUser = inquirerResponse.username;
        
        // call the getTweets function
        getTweets();
    });
}

// function for when a user wants to find a movie
function runMoviePrompt() {

    // prompt the user to input a movie name
    inquirer.prompt([
        {
            type: "input",
            message: "What movie would you like to find?",
            name: "movieName"
        }
    ]).then(function(inquirerResponse) {

        // stores the movie name entered in the movieName variable
        movieName = inquirerResponse.movieName;

        // call the getMovieData function
        getMovieData();
    })
}

// function for when the user wants to run the instructions specified in the random.txt file
function runInstructions() {

    fs.readFile("random.txt", "utf8", function(err, data) {

        // log any errors
        if (err) {
            console.log(err);
        } else {

            // split the text in the file into separate items in an array
            var fileArr = data.split(",");

            // the first item in the array are the instructions
            var instruction = fileArr[0];

            // determine which action to run and store the second item in the array
            switch(instruction) {
                case "my-tweets":
                    twitterUser = fileArr[1];
                    getTweets();
                    break;
                case "spotify-this-song":
                    spotifyQuery = fileArr[1];
                    getSpotifySong();
                    break;
                case "movie-this":
                    movieName = fileArr[1];
                    getMovieData;
                    break;
                default:
                    console.log("\nThese instructions don't make any sense!  Who wrote this garbage?")
            }
        }
    });
}

function getMovieData() {

    // concatonate the movie name and remove any spaces
    movieName = movieName.replace(/ /g, "+");

    // create the queryURL for the OMDB API call
    var queryURL = "https://www.omdbapi.com/?t=" + movieName + "&" + omdbAPI;

    // use request to access the OMDB API
    request(queryURL, function (error, response, body) {

        // if the request is successful
        if (!error && response.statusCode === 200) {

            // parse the response
            body = JSON.parse(body);

            // store the relevant information received
            var movieInfo = "\n********************************" + 
                            "\nTitle: " + body.Title + 
                            "\nCreated in: " + body.Year + 
                            "\nIMDB Rating: " + body.Ratings[0].Value + 
                            "\nRotten Tomatoes Score: " + body.Ratings[1].Value +
                            "\nProduced in: " + body.Country +
                            "\nLanguage: " + body.Language +
                            "\nMain Actors: " + body.Actors +
                            "\nPlot Summary: " + body.Plot;
            
            // console log the movie information and add it to the log
            console.log(movieInfo);
            postToLog(movieInfo);
            
        } 
    });
}

function getSpotifySong() {

    // search the spotify API for a track with the track name stored in the spotifyQuery variable
    spotify.search({
        type: 'track',
        query: spotifyQuery
    }, function (err, data) {
        
        if (err) {

            // log any errors received
            console.log(err);
        } else {

            // store the first track returned as a variable
            var trackData = data.tracks.items[0];

            // store the relevant information received 
            var trackInfo = "\n********************************" + "\nTrack Title: " + trackData.name + 
                            "\nArtist: " + trackData.artists[0].name + "\nAlbum: " + trackData.album.name + 
                            "\nSample: " + trackData.external_urls.spotify
            
            // console log the song information and add it to the log
            console.log(trackInfo);
            postToLog(trackInfo);
        }
    });
}

function getTweets() {

    // set the twitter parameters with the number of tweets to display and the twitter username
    var twitterParams = {
        screen_name: twitterUser,
        count: 10,
    };

    // call the twitter API method for getting a user's most recent tweets
    client.get('statuses/user_timeline', twitterParams, function(err, tweets, response) {
        if (err) {

            // log any errors received
            return console.log(err);
        } else {

            // console.log the number of tweets displayed and the username
            var twitterMessage = 'Here are the ' + twitterParams.count + ' most recent tweets from: ' + twitterParams.screen_name;
            
            console.log(twitterMessage);
            postToLog(twitterMessage);

            // console log the tweets and when they were created
            for (var i = 0; i < tweets.length; i++) {

                var tweetDisplay = "\n********************************" + "\n" + tweets[i].created_at + "\n" + tweets[i].text;

                console.log(tweetDisplay);
                postToLog(tweetDisplay);
            }
        }
    });
}

// function for posting messages to the log
function postToLog(message) {

    // replace the linebreak syntax for posting to a txt file
    message = message.replace(/\n/g, "\r\n");

    // append the message to the log file
    fs.appendFile(log, message, function(err) {
        
        // display any errors
        if (err) {
            console.log(err);
        }
    });
}

// display the inquirer when the file is run
runActionPrompt();