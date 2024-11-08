'use strict';

/***
 * Exported functions to be used in the testing scripts.
 */

module.exports = {
  uploadRandomizedUser,
  processRegisterReply,
  getLoginDetails,
  uploadBlobBody,
  getShortDownloadDetails,
  processVideoAddReply,
  processVideoGetReply,
  setupLikeShort,
  //getShortDetails,
  getFollowDetails,
}

const SHORT_ID_FIELD = 'shortId';
const USER_ID_FIELD = 'userId';

var videoIds = []
var registeredUsersMap = new Map();
var shortMap;
var pendingUsers = []
var videos = []

const fs = require('fs')
const csv = require('@fast-csv/parse');

var registeredUsers = []

function addUser(user_info) {
    let userId = user_info[0];
    let pwd = user_info[2];
    let email = user_info[1];
    let displayName = user_info[3];
    let user = {
        userId: userId,
        pwd: pwd,
        email: email,
        displayName: displayName
    }
    registeredUsersMap.set(user.userId, user);
    registeredUsers.push(user.userId);
}

function addTestData() {
    var basefile
	if( fs.existsSync( '/shorts')) 
		basefile = '/data/users.csv'
	else
		basefile =  'data/users.csv'	
    csv.parseFile(basefile)
        .on('error', error => console.error(error))
        .on('data', row => addUser(row))
        .on('end', rowCount => console.log(`Parsed ${rowCount} rows`));
}

addTestData();

// Returns a random username constructed from lowercase letters.
function randomUsername(char_limit){
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let username = '';
    let num_chars = Math.floor(Math.random() * char_limit) + 1;
    for (let i = 0; i < num_chars; i++) {
        username += letters[Math.floor(Math.random() * letters.length)];
    }
    return username;
}


// Returns a random password, drawn from printable ASCII characters
function randomPassword(pass_len){
    const skip_value = 33;
    const lim_values = 94;
    
    let password = '';
    let num_chars = Math.floor(Math.random() * pass_len);
    for (let i = 0; i < pass_len; i++) {
        let chosen_char =  Math.floor(Math.random() * lim_values) + skip_value;
        if (chosen_char == "'" || chosen_char == '"')
            i -= 1;
        else
            password += chosen_char
    }
    return password;
}

/**
 * Process reply of the user registration.
 */
function processRegisterReply(requestParams, response, context, ee, next) {
    if( typeof response.body !== 'undefined' && response.body.length > 0) {
        registeredUsers.push(response.body);
        pendingUsers.splice(pendingUsers.indexOf(response.body),1);
    }
    return next();
} 

/**
 * Register a random user.
 */

function uploadRandomizedUser(requestParams, context, ee, next) {
    var username = randomUsername(9)
    let pword = randomPassword(15);
    let email = username + "@campus.fct.unl.pt";
    let displayName = username;
    
    const user = {
        userId: username,
        pwd: pword,
        email: email,
        displayName: displayName
    };
    requestParams.body = JSON.stringify(user);
    registeredUsersMap.set('uesrname', user);
    pendingUsers.push(username);
    
    return next();
} 

// Loads data about shorts from disk
function loadData() {
	var i
	var basefile
	if( fs.existsSync( '/shorts')) 
		basefile = '/shorts/house.'
	else
		basefile =  'shorts/house.'	
	for( i = 1; i <= 50 ; i++) {
        // best to not keep a bunch of files in memory.
		//var vid  = fs.readFileSync(basefile + i + '.mpv')
		var vid  = basefile + i + '.jpg'
		videos.push( vid )
	}
}

loadData();

function saveShorts() {
	var basefile1
    var basefile2
	if (fs.existsSync( '/shorts'))  {
		basefile1 = '/shorts/shorts.list'
        basefile2 = '/shorts/shorts.map'
    } else {
		basefile1 = 'shorts/shorts.list'	
        basefile2 = 'shorts/shorts.map'
    }
    fs.writeFile(basefile1, JSON.stringify(videoIds), err => {
        if (err) {
            console.error(err);
        }
    })
    fs.writeFile(basefile2, JSON.stringify(Object.fromEntries(shortMap)), err => {
        if (err) {
            console.error(err);
        }
    })
}

function loadShorts() {
	var basefile1
    var basefile2
	if( fs.existsSync( '/shorts')) {
		basefile1 = '/shorts/shorts.list'
        basefile2 = '/shorts/shorts.map'
	} else {
		basefile1 = 'shorts/shorts.list'	
        basefile2 = 'shorts/shorts.map'
    }
    fs.readFile(basefile1, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        videoIds.push(...JSON.parse(data));
    });
    fs.readFile(basefile2, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            shortMap = new Map();
            return;
        }
        shortMap = new Map(Object.entries(JSON.parse(data)));
    });
}

loadShorts()

// May need to change some of this logic.
function selectVideoToDownload(context, events, done) {
	if( videoIds.length > 0) {
        var random = Math.floor(Math.random() * videoIds.length)
		context.vars['videoId'] = videoIds[random]
	} else {
		delete context.vars.videoId
	}
	return done()
}

function uploadBlobBody(requestParams, context, ee, next) {
    var random = Math.floor(Math.random() * videos.length)
	requestParams.body = fs.readFileSync(videos[random])
	return next()
}

function processVideoAddReply(requestParams, response, context, ee, next) {
    if( typeof response.body !== 'undefined' && response.body.length > 0) {     
        var short_details =  JSON.parse(response.body);
        if(SHORT_ID_FIELD == "shortId") {
            videoIds.push(short_details.shortId);
            shortMap.set(short_details.shortId, short_details);
        } else if (SHORT_ID_FIELD == "id") {
            videoIds.push(short_details.id);
            shortMap.set(short_details.id, short_details);
        }
        context.vars['blobUrl'] = short_details.blobUrl.split("/blobs/").at(-1)
        saveShorts();
    }                                                                           
    return next();                                                              
}

function processVideoGetReply(requestParams, response, context, ee, next) {
    if( typeof response.body !== 'undefined' && response.body.length > 0) {     
        var short_details =  JSON.parse(response.body);
        context.vars['blobUrl'] = short_details.blobUrl.split("/blobs/").at(-1)
    }                                                                           
    return next();                                                              
}

// Helper function to get a random user.
function chooseRandomRegisteredUser() {
    var random = Math.floor(Math.random() * registeredUsers.length)
    return registeredUsersMap.get(registeredUsers[random]);
}

// Helper function to get a random user.
function chooseRandomShort() {
    var random = Math.floor(Math.random() * videoIds.length)
    return videoIds[random];
}

function getLoginDetails(requestParams, context, ee, next) {
    var user = chooseRandomRegisteredUser();
    context.vars['userId'] = user.userId;
    context.vars['pwd'] = user.pwd;
    return next();
}

function setupLikeShort(requestParams, context, ee, next) {
    var user = chooseRandomRegisteredUser();
    var shortv = chooseRandomShort();
    context.vars['userId'] = user.userId;
    context.vars['pwd'] = user.pwd;
    context.vars['shortId'] = shortv;
    return next();
}

function getFollowDetails(requestParams, context, ee, next) {
    if(registeredUsers.length <= 2) {
        return next();
    }
    var user1 = chooseRandomRegisteredUser();
    var user2 = chooseRandomRegisteredUser();
    while(user1 == user2) {
        user2 = chooseRandomRegisteredUser();
    }
    context.vars['userId1'] = user1.userId;
    context.vars['userId2'] = user2.userId;
    context.vars['pwd'] = user1.pwd;
    return next();
}

function getShortDownloadDetails(requestParams, context, ee, next) {
    if(videoIds.length <= 0) {
        let error = new Error("No shorts exist yet.");
        return next(error);
    }
    var short_id = chooseRandomShort();
    context.vars['shortId'] = short_id;
    var owner_details = registeredUsersMap.get(shortMap.get(short_id).ownerId);
    context.vars['userId'] = owner_details.userId;
    context.vars['pwd'] = owner_details.pwd; 
    return next();
}
