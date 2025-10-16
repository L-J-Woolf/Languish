// ---------------------------------------------------------
// GLOBALS 
// ---------------------------------------------------------

// specify globals
var local_database_decks = [];
var local_database_cards = [];
//var query_result = [];
var developer_mode = false;
var first_load = true;
var deck_id = "-ObeUEdEP7mUYLBzyCUK";

// specify firebase credentials and identifiers
var firebase_config = {
  apiKey: 'AIzaSyAu2-341EtOigiNZ6qeAw_Tdjr51v_OtAQ',
  authDomain: 'learn-german-with-lucas.firebaseapp.com',
  databaseURL: 'https://learn-german-with-lucas-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'learn-german-with-lucas',
  storageBucket: 'learn-german-with-lucas.firebasestorage.app',
  messagingSenderId: '537448205963',
  appId: '1:537448205963:web:7059547256bfbe4261ce8e',
  measurementId: 'G-RXG0SDPQ6Y'
};

// connect to firebase with your project details
firebase.initializeApp(firebase_config);

// get a reference for the realtime database
var realtime_database = firebase.database();

// ---------------------------------------------------------
// START-UP 
// ---------------------------------------------------------

// initialise the app once the DOM ready
document.addEventListener('DOMContentLoaded', async function initialise_app() {
  
  // log messages in the console
  console.log("initialising app (v3.2)");
  
  // startup functions which must fire and complete first
  await manually_sync_database();
  await manually_sync_decks();
  await update_user_interface();
  await select_initial_scene();
  
  // startup functions which may fire concurrently
  install_popstate_handler();
  activate_realtime_decks_listener();
  activate_realtime_cards_listener();
  
  // log messages in the console
  console.log("initialisation complete");
});

// ---------------------------------------------------------
// START-UP FUNCTIONS 
// ---------------------------------------------------------

// STEP 1. manually sync the local database with the realtime database
async function manually_sync_database() {
  
  // log messages in the console
  console.log("manually syncing database");

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  return realtime_database.ref('cards').once('value').then(function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_cards = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
   
    // log messages in the console
    console.log('database synced (manual) ' + timestamp() + ', total words: ' + local_database_cards.length);
  }); 
}

// STEP 1. manually sync the local database with the realtime database
async function manually_sync_decks() {
  
  // log messages in the console
  console.log("manually syncing database");

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  return realtime_database.ref('decks').once('value').then(function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_decks = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
   
    // log messages in the console
    console.log('decks synced (manual) ' + timestamp() + ', total decks: ' + local_database_decks.length);
  }); 
}

// STEP 2. build and update user-interface elements (utilises local database)
async function update_user_interface() {
  
  // log messages in the console
  console.log("updating user interface");
  
  // functions to build or update user-interface elements
  //query_unique_entries(local_database_cards, 'deck');
  render_decks_list();
  render_cards_list();
  update_synced_timestamp();
}

// STEP 3. load the correct scene
async function select_initial_scene() {
  
  // log messages in the console
  console.log("selecting initial scene");

  // 1) prefer the hash in the URL if it points to a real scene element
  var hash = location.hash.slice(1);
  var initial_scene = (hash && document.getElementById(hash)) ? hash : null;

  // 2) otherwise try the last scene saved during the previous session
  if (!initial_scene) {
    try {
      var prev = sessionStorage.getItem('last_scene');
      if (prev && document.getElementById(prev)) {
        initial_scene = prev;
      }
    } catch (e) {
      // ignore storage errors and fall through to default
    }
  }

  // 3) fall back to your default scene
  if (!initial_scene) {
    initial_scene = 'scene_dashboard'; // specify default scene
  }

  // render without pushing a new history entry on first paint
  loadScene(initial_scene, { push: false });
}

// STEP 4. Install a single popstate handler once for back and forward navigation
async function install_popstate_handler() {
  
  // log messages in the console
  console.log("installing state handler");
  
  window.addEventListener("popstate", function (event) {
    var id = (event.state && event.state.scene) || location.hash.slice(1);
    // Render without pushing a new history entry
    if (id) loadScene(id, { push: false });
  });
}

// STEP 5. activate realtime listener for ongoing updates
async function activate_realtime_decks_listener() {
  
  // log messages in the console
  console.log('activating realtime listener');

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  realtime_database.ref('decks').on('value', function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_decks = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : []; 
    
    // functions to run when the database is updated
     if (first_load === false) {
      update_user_interface();
      console.log('database synced (realtime) ' + timestamp() + ', total decks: ' + local_database_decks.length);
    }
    
    // prevents functions from firing on first load
    else {
      first_load = false;
    }

  });
}

async function activate_realtime_cards_listener() {
  
  // log messages in the console
  console.log('activating realtime listener');

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  realtime_database.ref('cards').on('value', function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_cards = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : []; 
    
    // functions to run when the database is updated
     if (first_load === false) {
      update_user_interface();
      console.log('database synced (realtime) ' + timestamp() + ', total cards: ' + local_database_cards.length);
    }
    
    // prevents functions from firing on first load
    else {
      first_load = false;
    }

  });
}

// ---------------------------------------------------------
// LISTENERS 
// ---------------------------------------------------------

// get varibles
var btn_back = document.querySelectorAll('.btn_back');
var btn_add_deck = document.getElementById('btn_add_deck');
var btn_add_card = document.getElementById('btn_add_card');
var btn_practice_all = document.getElementById('btn_practice_all');

var btn_toggle_developer_mode = document.getElementById('btn_toggle_developer_mode');

// listener to create listeners for all elements by class
btn_back.forEach(item => {item.addEventListener("click", () => {
  window.history.back();
  });
});

// listener to show and hide scenes
// btn_add_deck.addEventListener("click", function() {
//   loadScene('scene_add_deck');
// });
btn_add_deck.addEventListener("click", function() {
  add_deck_to_database(generate_default_deck_name());
});

// listener to show and hide scenes
// btn_add_card.addEventListener("click", function() {
//   loadScene('scene_add_item');
// });
btn_add_card.addEventListener("click", function() {
  add_card_to_database();
});

// listener to show and hide scenes
btn_practice_all.addEventListener("click", function() {
  loadScene('scene_deck_list');
});

// listener to enable or disable developer mode
btn_toggle_developer_mode.addEventListener("dblclick", function() {
  toggle_developer_mode();
});

// ---------------------------------------------------------
// ATOMIC FUNCTIONS
// ---------------------------------------------------------

// function to log a specified variable
function log_variable(variable_to_log) {
  console.log(variable_to_log);
}

// function to to speak aloud a string in german
function speakGerman(text_to_speak) {
  speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text_to_speak);
  utterance.lang = "de-DE";
  utterance.rate = 1.0;    // default is 1, range is 0.1 to 10
  speechSynthesis.speak(utterance);
}

// Function to fetch the current timestamp
function timestamp() {
  
  // create variable to store date-time object
  var now = new Date();

  // specify custom formatting for date-time object
  var format = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
   
  //reutrn the formatted date-time object
  return new Intl.DateTimeFormat('en-AU', format).format(now).toLowerCase(); 
}

function generate_default_deck_name() {
  const strings = [
    "Bananas are berries, but strawberries are not",
    "Sharks existed before trees",
    "Sloths can hold breath longer than dolphins",
    "Honey never spoils",
    "Octopuses have three hearts",
    "Wombat poo is cube-shaped",
    "Space smells like burnt steak",
    "Penguins propose with pebbles",
    "A day on Venus is longer than a year",
    "The Eiffel Tower grows in summer heat"
  ];
  
  const randomIndex = Math.floor(Math.random() * strings.length);
  return strings[randomIndex];
}

// ---------------------------------------------------------
// DEDICATED FUNCTIONS
// ---------------------------------------------------------

// function to search an array for all unique values attributed to a specified key
function query_unique_entries(array_to_query, key_to_query) {
  
  //confirm the fucntion is running
  console.log('querying unique entries for "' + key_to_query + '"');

  // extracts all values attributed to (key_to_query) from each object in (array_to_query)
  var all_entries = array_to_query.map(item => item[key_to_query]);

  // stores the (all_entries) map as a set, which removes duplicates
  var unique_entries = [...new Set(all_entries)];

  // build a new array of objects with counts
  query_result = unique_entries.map(value => {
    return {
      type: value,
      count: all_entries.filter(entry => entry === value).length
    };
  });

  // logs a message in the console log
  console.log(query_result);
}

// function to search an array for all items with both the specefied key and value
function query_all_entries(array_to_query, key_to_query, value_to_query) {
  
  //confirm the fucntion is running
  console.log('querying all entries for "' + key_to_query + '" and "' + value_to_query + '"');

  // creates a new array with items filtered from the specified array (array_to_query) with the specefied key (key_to_query) and value (value_to_query)
  query_result = array_to_query.filter(item => item[key_to_query] === value_to_query);
  
  // logs a messagse in the console log
  console.log(query_result);
}

// function to add an item into the database
function add_deck_to_database(deck_name) {
  
  // get a reference to the database
  var deck_ref = realtime_database.ref('decks');

  // push a new item (firebase will give it a unique ID)
  deck_ref.push({
    name: deck_name
  });

  // show messages in the console
  console.log('new deck added:', deck_name);
}

// function to edit an item into the database
function edit_deck_in_database(deck_name, unique_id) {
  
  // point to the specific item using its id
  var deck_ref = realtime_database.ref('decks/' + unique_id);

  // update only the provided fields
  deck_ref.update({
    name: deck_name
  });

  console.log('deck updated:', deck_name, unique_id);
}

// function to add an item into the database
function add_card_to_database() {
  
  // get a reference to the database
  var card_ref = realtime_database.ref('cards');

  // push a new item (firebase will give it a unique ID)
  card_ref.push({
    deck: deck_id,
    question: "",
    answer: "",
    score: 0,
    last_reviewed: Date.now()
  });

  // show messages in the console
  console.log('new card added:');
}

// function to edit an item into the database
function edit_card_in_database(question, answer, unique_id) {
  
  // point to the specific item using its id
  var card_ref = realtime_database.ref('cards/' + unique_id);

  // update only the provided fields
  card_ref.update({
    question: question,
    answer: answer
  });

  // show messages in the console
  console.log('card updated:', question, answer, unique_id);
}

// function to delete a word by its values
function delete_database_item(english, german, type) {
  
  // get a reference to 'words' list in the database
  var word_ref = realtime_database.ref('words');

  // look through each word entry
  word_ref.once('value', function(snapshot) {
    
    //loop through each word in 'words'
    snapshot.forEach(function(childSnapshot) {
      var word = childSnapshot.val();  // The word data
      var key = childSnapshot.key;     // The unique key (like -Nf8...)

      // Check if both english and german match
      if (word.english === english && word.german === german && word.type === type) {
        // If it matches, remove it
        realtime_database.ref('words/' + key).remove();
        console.log('word removed: ', english, german);
      }
    });
  })
}

// function to render decks list
function render_decks_list() {
  
  // show messages in the console
  console.log('rendering decks list');

  // select the element to render inside
  var deck_list = document.getElementById('dynamic_list_decks');

  // ensure the element has an innerhtml property
  deck_list.innerHTML = null;

  // specify array to loop through and perform actions
  local_database_decks.forEach (
      
    // specify the actions to perform on each list item
      function (list_item) {

        // insert html template
        deck_list.insertAdjacentHTML("beforeend", deck_snippet);
        
        // grab the element just inserted
        var snippet = deck_list.lastElementChild;

        // fill its fields
        snippet.setAttribute('data-id', list_item.id); // set id
        snippet.querySelector(".deck_snippet_name").innerHTML = list_item.name;
        snippet.querySelector(".deck_snippet_count").innerHTML = "69";
      }
    );
}

// function to render cards list
function render_cards_list() {
  
  // show messages in the console
  console.log('rendering cards list');

  // select the element to render inside
  var cards_list = document.getElementById('dynamic_list_cards');
  
  // ensure the element has an innerhtml property
  cards_list.innerHTML = null;

  // specify array to loop through and perform actions
  local_database_cards.forEach (
      
    // specify the actions to perform on each list item
      function (list_item) {

        // insert html template
        cards_list.insertAdjacentHTML("beforeend", card_snippet);
        
        // grab the element just inserted
        var snippet = cards_list.lastElementChild;

        // fill its fields
        snippet.setAttribute('data-id', list_item.id); // set id
        snippet.querySelector(".card_snippet_question").innerHTML = list_item.question;
        snippet.querySelector(".card_snippet_answer").innerHTML = list_item.answer;
      }
    );
}

// fucntion to update the synced timestamp
function update_synced_timestamp() {

  // locate html element by id, and store it a varible
  var scene_sync_date = document.getElementById('scene_sync_date');
  
  // update the specified element
  scene_sync_date.innerHTML = 'synced ' + timestamp();

  // log messages in the console
  console.log("sync timestamp updated");
}

// function to retrieve values from inputs
function submit_card() {
  
  // locate input fields
  var deck_name = document.getElementById("input_deck_name");
  
  // store their values
  var deck_name = input_deck_name.value;
  
  // validate inputs
  if (deck_name === "") {
  console.log("please fill out all form fields");
  
  // code to execute if successful
  } else {
  console.log("submitting data");
  add_deck_to_database(deck_name);  
  } 
  
  // reset the fields afterwards
  deck_name.value = "";
}

// function to retrieve values from inputs
function submit_user_input() {
  
  // locate input fields
  var deck_field = document.getElementById("deck_field");
  var english_field = document.getElementById("english_field");
  var german_field = document.getElementById("german_field");
  
  // store their values
  var deck_input = deck_field.value;
  var english_input = english_field.value;
  var german_input = german_field.value;
  
  // validate inputs
  if (deck_input === "" || english_input === "" || german_input === "") {
  console.log("please fill out all form fields");
  
  // code to execute if successful
  } else {
  console.log("submitting data");
  add_database_item(english_input, german_input, 1, deck_input)  
  } 
  
  // reset the fields afterwards
  deck_field.value = "";
  english_field.value = "";
  german_field.value = "";
}

function toggle_developer_mode() {

  // code to execute if the conditions are met
  if (developer_mode === false) { 
  var developer_options = document.getElementsByClassName("is_admin_only");
  for (let i = 0; i < developer_options.length; i++) {developer_options[i].style.display = "inline-block";}
  console.log("developer mode enabled");    
  developer_mode = true;

  // code to execute if the conditions are not met
  } else if (developer_mode === true) { 
  var developer_options = document.getElementsByClassName("is_admin_only");
  for (let i = 0; i < developer_options.length; i++) {developer_options[i].style.display = "none";}
  console.log("developer mode disabled");  
  developer_mode = false;
  } 
}

// function which loads specified scene and hides all others
function loadScene(scene_to_load) {
  
  // Find the scene element
  var scene_element = document.getElementById(scene_to_load);

  // Hide all scenes
  var scenes = document.querySelectorAll(".scene");
  for (var i = 0; i < scenes.length; i++) {scenes[i].style.display = "none";}

  // Show the requested scene
  scene_element.style.display = "block";

  // Remember the last scene so refresh without a hash can restore it
  try { sessionStorage.setItem('last_scene', scene_to_load); } catch (e) {}

  // push history to browser
  if (location.hash.slice(1) !== scene_to_load) {
    history.pushState({ scene: scene_to_load }, "", "#" + scene_to_load);
  }

  // Log for debugging
  console.log('loading scene: ' + scene_to_load);
}

document.getElementById('dynamic_list_decks').addEventListener('click', event => {
  
  // find the clicked item within the wrapper
  var clicked_item = event.target.closest('.deck_snippet_wrapper');
  
  // addition code to execute
  console.log('deck selected:id: ', clicked_item.dataset.id);

});

// attach a delegated listener to a stable container element.
document.getElementById('dynamic_list_decks').addEventListener('dblclick', event => {
  
  // find the clicked item within the wrapper
  var clicked_item = event.target.closest('.deck_snippet_wrapper');

  // find the element within the clicked item you want to modify
  var element_to_modify = clicked_item.querySelector('.deck_snippet_name');

  //clicked_item.style.background = "red";
  element_to_modify.contentEditable = "true";
  element_to_modify.style.outline = 'none';
  element_to_modify.focus();

  element_to_modify.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    //event.preventDefault(); // stops a new line
    element_to_modify.blur();
    edit_deck_in_database(element_to_modify.innerText, clicked_item.dataset.id)
  }
  });

});

// attach a delegated listener to a stable container element.
document.getElementById('dynamic_list_cards').addEventListener('click', event => {
  
  // find the clicked item within the wrapper
  var clicked_item = event.target.closest('.card_snippet_wrapper');

  // find the element within the clicked item you want to modify
  var question_to_modify = clicked_item.querySelector('.card_snippet_question');
  var answer_to_modify = clicked_item.querySelector('.card_snippet_answer');
  var card_unique_id = clicked_item.dataset.id;

  question_to_modify.addEventListener('blur', function () {
  edit_card_in_database(question_to_modify.innerText, answer_to_modify.innerText, card_unique_id )
  console.log('card edited ' + question_to_modify.innerText, answer_to_modify.innerText, card_unique_id);
  });

  answer_to_modify.addEventListener('blur', function () {
  edit_card_in_database(question_to_modify.innerText, answer_to_modify.innerText, card_unique_id )
  console.log('card edited ' + question_to_modify.innerText, answer_to_modify.innerText, card_unique_id);
  });

});