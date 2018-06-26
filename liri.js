// utilize dotenv to load the config settings and API keys
require("dotenv").config();

// require packages
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

function actionPrompt() {

    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            choices: ["Read My Tweets", "Find A Song", "Find A Movie", "Run The Instructions"],
            name: "action"
        }
    ]).then(function(inquirerResponse) {
    
        actionSwitch(inquirerResponse.action);
    });
}


function actionSwitch(op) {
    switch(op) {
        case "Read My Tweets":
            twitterPrompt();
            break;
        case "Find A Song":
            spotifyPrompt();
            break;
        case "Find A Movie":
            moviePrompt();
            break;
        case "Run The Instructions":
            console.log("file");
            break;
        default:
            console.log("you have selected an invalid choice");
    }
}

function spotifyPrompt() {

    inquirer.prompt([
        {
            type: "input",
            message: "What song would you like to find?",
            name: "songInput"
        }
    ]).then(function(inquirerResponse) {

        spotifyQuery = inquirerResponse.songInput;

        getSpotifySong();
    });
}

function twitterPrompt() {

    inquirer.prompt([
        {
            type: "input",
            message: "What is your twitter username?",
            name: "username"
        }
    ]).then(function(inquirerResponse) {

        twitterUser = inquirerResponse.username;
        
        getTweets();
    });
}

function moviePrompt() {

    inquirer.prompt([
        {
            type: "input",
            message: "What movie would you like to find?",
            name: "movieName"
        }
    ]).then(function(inquirerResponse) {

        movieName = inquirerResponse.movieName;

        getMovieData();
    })
}


function doWhatItSays() {

    fs.readFile("random.txt", "utf8", function(err, data) {

        if (err) {
            console.log(err);
        } else {

            var fileArr = data.split(",");

            console.log(fileArr);



        }

    });
}

function getMovieData() {

    // concatonate the movie name and remove any spaces
    movieName = movieName.replace(/ /g, "+");

    var queryURL = "https://www.omdbapi.com/?t=" + movieName + "&" + omdbAPI;

    request(queryURL, function (error, response, body) {

        // if the request is successful
        if (!error && response.statusCode === 200) {

            body = JSON.parse(body);

            // console.log out the title, artist, album and song url
            console.log("\n********************************");
            console.log(body.Title);
            console.log("Created in: " + body.Year);
            console.log("IMDB Rating: " + body.Ratings[0].Value);
            console.log("Rotten Tomatoes Score: " + body.Ratings[1].Value);
            console.log("Produced in: " + body.Country);
            console.log("Language: " + body.Language);
            console.log("Main Actors: " + body.Actors);
            console.log("Plot Summary: " + body.Plot);
        } 
    });
}

function getSpotifySong() {

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
            
            // console.log out the title, artist, album and song url
            console.log("\n********************************");
            console.log("Track Title: " + trackData.name);
            console.log("Artist: " + trackData.artists[0].name);
            console.log("Album: " + trackData.album.name);
            console.log("Sample: " + trackData.external_urls.spotify);
        }
    });
}

function getTweets() {

    var twitterParams = {
        screen_name: twitterUser,
        count: 10,
    };

    client.get('statuses/user_timeline', twitterParams, function(err, tweets, response) {
        if (err) {

            // log any errors received
            return console.log(err);
        } else {

            // console.log the number of tweets displayed and the username
            console.log('Here are the ' + twitterParams.count + ' most recent tweets from: ' + twitterParams.screen_name);

            // 
            for (var i = 0; i < tweets.length; i++) {
                console.log("\n********************************");
                console.log(tweets[i].created_at);
                console.log(tweets[i].text);
            }
        }
    });
}

// display the inquirer when the file is run
actionPrompt();
